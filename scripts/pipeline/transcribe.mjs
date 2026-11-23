import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runProcess } from "./media.mjs";

const pipelineDir = path.dirname(fileURLToPath(import.meta.url));
const bridgePath = path.join(pipelineDir, "faster_whisper_bridge.py");
const defaultKhmerModel = path.join(
  pipelineDir,
  "..",
  "..",
  ".models",
  "faster-whisper-base-khmer"
);

const KHMER_SCRIPT = /[\u1780-\u17FF]/;

const pythonEnv = {
  PYTHONUTF8: "1",
  PYTHONIOENCODING: "utf-8",
  PYTHONUNBUFFERED: "1",
  OMP_NUM_THREADS: "8",
  MKL_NUM_THREADS: "8",
};

let fasterWhisperAvailable = null;

async function hasFasterWhisper() {
  if (fasterWhisperAvailable !== null) return fasterWhisperAvailable;
  try {
    await runProcess("python", ["-c", "import faster_whisper"], {
      env: pythonEnv,
    });
    fasterWhisperAvailable = true;
  } catch {
    fasterWhisperAvailable = false;
  }
  return fasterWhisperAvailable;
}

function cleanWord(rawText, dropOnReplacement = false) {
  let text = String(rawText ?? "").trim();
  if (!text) return "";
  // The Khmer fine-tune can emit byte-fallback characters on low-confidence
  // audio. A single token containing one is unsafe, but a whole segment often
  // has just one bad glyph and is still mostly correct Khmer.
  if (text.includes("\uFFFD")) {
    if (dropOnReplacement) return "";
    text = text.replace(/\uFFFD+/g, "");
  }
  text = text
    .replace(/\u200B/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // Collapse invalid duplicate Khmer combining vowels/diacritics (\u17B6 to \u17D3)
  // e.g. \u17B8\u17B8\u17B8 -> \u17B8
  text = text.replace(/([\u17B6-\u17D3])\1+/gu, "$1");
  // Collapse the Khmer repetition sign when the model loops it (ៗៗៗ -> ៗ)
  text = text.replace(/(\u17D7)\1+/gu, "$1");
  // Collapse repeated characters/syllables (e.g. វ៉ៃវ៉ៃវ៉ៃវ៉ៃ -> វ៉ៃ)
  text = text.replace(/([^\s\u17D2]{1,15}?)\1{3,}/gu, "$1");
  // Collapse repeating phrases (e.g. របស់អត់ចានរបស់អត់ចាន -> របស់អត់ចាន)
  text = text.replace(/(.{3,30}?)\1{2,}/gu, "$1");
  return text.trim();
}

function isNoiseWord(text) {
  if (!text || text.includes("\uFFFD")) return true;
  // 4+ identical consecutive characters is noise/hallucination
  if (/(.)\1{3,}/u.test(text)) return true;
  // Isolated Khmer combining signs without any base consonant is noise
  if (/^[\u17B6-\u17D3\u17D2]+$/u.test(text)) return true;
  // Punctuation or symbol-only tokens are not transcript words
  if (/^[^\p{L}\p{N}\u17D4-\u17D6]+$/u.test(text)) return true;
  return false;
}

const kmSegmenter =
  typeof Intl !== "undefined" && Intl.Segmenter
    ? new Intl.Segmenter("km", { granularity: "word" })
    : null;

function khmerTokens(text) {
  if (!text) return [];
  if (kmSegmenter) {
    const tokens = [];
    let pendingSpace = false;
    for (const item of kmSegmenter.segment(text)) {
      const seg = item.segment;
      if (/\s/.test(seg)) {
        pendingSpace = true;
        continue;
      }
      if (!seg) continue;
      tokens.push({ text: seg, spaceBefore: pendingSpace });
      pendingSpace = false;
    }
    if (tokens.length > 0) return tokens;
  }

  const tokens = [];
  const chars = Array.from(text);
  const startsCluster = (char) => /[\u1780-\u17B3\u17E0-\u17E9]/.test(char);
  let current = "";
  let pendingSpace = false;

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    if (/\s/.test(char)) {
      if (current) {
        tokens.push({ text: current, spaceBefore: pendingSpace });
        current = "";
      }
      pendingSpace = true;
      continue;
    }

    const previous = chars[index - 1];
    if (current && startsCluster(char) && previous !== "\u17D2") {
      tokens.push({ text: current, spaceBefore: pendingSpace });
      current = "";
      pendingSpace = false;
    }
    current += char;
  }

  if (current) {
    tokens.push({ text: current, spaceBefore: pendingSpace });
  }

  return tokens;
}

function tokenWeight(text) {
  return Math.max(1, Array.from(text.replace(/[\s\p{P}\p{S}]/gu, "")).length);
}

// A forced Khmer fine-tune can collapse on non-Khmer audio into an endless
// repeated glyph (e.g. a run of subscript vowels) with no spaces. That is a
// hallucination, not speech: no real Khmer sentence repeats one sign dozens of
// times, and the word splitter then emits thousands of single-glyph tokens.
const KHMER_REPEAT_RUN = /([\u1780-\u17FF])\1{11,}/u;

function khmerHallucination(segments) {
  for (const segment of segments) {
    if (typeof segment.text === "string" && KHMER_REPEAT_RUN.test(segment.text)) {
      return true;
    }
  }
  return false;
}

function textTokens(text, khmer) {
  if (khmer) return khmerTokens(text);
  return text
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => ({ text: token, spaceBefore: true }));
}

export function parseTranscript(payload, language) {
  const words = [];
  const khmer = language === "km" || payload.language === "km";

  const pushWord = (text, start, end, spaceBefore) => {
    const last = words[words.length - 1];
    if (last && last.text === text) {
      const previous = words[words.length - 2];
      if (khmer || (previous && previous.text === text)) {
        return;
      }
    }
    // Check 2-word loop: [A, B, A, B] -> drop repeated B
    if (khmer && words.length >= 3) {
      const w1 = words[words.length - 2];
      const w0 = words[words.length - 3];
      if (w0.text === last.text && w1.text === text) return;
    }
    // Check 3-word loop: [A, B, C, A, B, C] -> drop repeated C
    if (khmer && words.length >= 5) {
      const w2 = words[words.length - 3];
      const w1 = words[words.length - 4];
      const w0 = words[words.length - 5];
      if (
        w0.text === last.text &&
        w1.text === words[words.length - 2].text &&
        w2.text === text
      ) {
        return;
      }
    }
    words.push({
      text,
      start: Number.isFinite(start) ? start : 0,
      end: Number.isFinite(end) ? end : Number.isFinite(start) ? start : 0,
      spaceBefore: Boolean(spaceBefore),
    });
  };

  for (const segment of payload.segments ?? []) {
    if (Number(segment.no_speech_prob) > 0.65) continue;
    if (Number(segment.avg_logprob) < -1) continue;

    if (Array.isArray(segment.words) && segment.words.length > 0) {
      for (let index = 0; index < segment.words.length; index += 1) {
        const word = segment.words[index];
        const text = cleanWord(word.word, true);
        if (!text || isNoiseWord(text)) continue;

        const start = Number(word.start);
        const end = Number(word.end);
        pushWord(
          text,
          start,
          Number.isFinite(end) ? end : Number.isFinite(start) ? start : 0,
          index > 0 || words.length > 0
        );
      }
      continue;
    }

    const text = cleanWord(segment.text);
    if (!text) continue;
    const tokens = textTokens(text, khmer).filter(
      (token) => token.text && !isNoiseWord(token.text)
    );
    if (tokens.length === 0) continue;

    const start = Number(segment.start) || 0;
    const end = Number(segment.end) || start;
    const totalWeight = tokens.reduce(
      (sum, token) => sum + tokenWeight(token.text),
      0
    );
    let cursor = start;
    tokens.forEach((token, index) => {
      const weight = tokenWeight(token.text);
      const tokenEnd =
        index === tokens.length - 1
          ? end
          : cursor + ((end - start) * weight) / Math.max(totalWeight, 1);
      pushWord(
        token.text,
        cursor,
        tokenEnd,
        token.spaceBefore || (index === 0 && words.length > 0)
      );
      cursor = tokenEnd;
    });
  }

  words.sort((a, b) => a.start - b.start);

  return {
    language: typeof payload.language === "string" ? payload.language : null,
    words,
  };
}

async function transcribeWithFasterWhisper(audioPath, outDir, options) {
  const outputPath = path.join(outDir, "transcript.json");
  let progress = 0;

  await runProcess(
    "python",
    [
      bridgePath,
      audioPath,
      "--model",
      options.model,
      "--language",
      options.language ?? "auto",
      "--output",
      outputPath,
    ],
    {
      env: pythonEnv,
      onLine: (line) => {
        const match = line.match(/^PROGRESS\s+(\d+(?:\.\d+)?)/);
        if (!match || !options.duration) return;
        const fraction = Math.min(1, Number(match[1]) / options.duration);
        if (fraction > progress) {
          progress = fraction;
          options.onProgress?.(fraction);
        }
      },
    }
  );

  const payload = JSON.parse(await readFile(outputPath, "utf8"));
  return { ...parseTranscript(payload, options.language), segments: payload.segments };
}

async function detectLanguage(audioPath, outDir, model) {
  const outputPath = path.join(outDir, "language.json");

  await runProcess(
    "python",
    [
      bridgePath,
      audioPath,
      "--model",
      model,
      "--detect-language",
      "--output",
      outputPath,
    ],
    { env: pythonEnv }
  );

  const payload = JSON.parse(await readFile(outputPath, "utf8"));
  return {
    language: typeof payload.language === "string" ? payload.language : null,
    probability: Number(payload.language_probability),
  };
}

async function transcribeWithWhisperCli(audioPath, outDir, options) {
  const args = [
    "-m",
    "whisper",
    audioPath,
    "--model",
    options.model,
    "--output_format",
    "json",
    "--word_timestamps",
    "True",
    "--beam_size",
    "1",
    "--condition_on_previous_text",
    "False",
    "--temperature_increment_on_fallback",
    "None",
    "--output_dir",
    outDir,
    "--verbose",
    "True",
  ];

  if (options.language && options.language !== "auto") {
    args.push("--language", options.language);
  }

  let progress = 0;
  await runProcess("python", args, {
    env: pythonEnv,
    onLine: (line) => {
      const match = line.match(/\[(\d+):(\d+):(\d+(?:\.\d+)?)\s+-->/);
      if (!match || !options.duration) return;
      const end =
        Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
      const fraction = Math.min(1, end / options.duration);
      if (fraction > progress) {
        progress = fraction;
        options.onProgress?.(fraction);
      }
    },
  });

  const jsonPath = path.join(
    outDir,
    `${path.basename(audioPath).replace(/\.wav$/i, "")}.json`
  );
  const payload = JSON.parse(await readFile(jsonPath, "utf8"));
  return parseTranscript(payload, options.language);
}

function usesKhmerScript(words) {
  return words.some((word) => KHMER_SCRIPT.test(word.text));
}

export async function transcribe(audioPath, outDir, options = {}) {
  const settings = {
    model: options.model ?? "base",
    language: options.language ?? "en",
    duration: options.duration,
    onProgress: options.onProgress,
  };

  if (await hasFasterWhisper()) {
    const khmerModel =
      options.khmerModel ??
      process.env.WHISPER_MODEL_KM ??
      defaultKhmerModel;
    const khmerAvailable = existsSync(path.join(khmerModel, "model.bin"));

    try {
      if (settings.language === "km" && khmerAvailable) {
        // Check the audio before forcing the Khmer model so English speech
        // never gets later shown as Khmer gibberish in the clip titles.
        let detected = null;
        try {
          detected = await detectLanguage(audioPath, outDir, settings.model);
        } catch (error) {
          console.warn(
            `[transcribe] language detection failed: ${error.message}`
          );
        }

        // Detection often mistakes Khmer speech for a neighbouring language
        // (Vietnamese, Thai) with high confidence. Only override the requested
        // Khmer model when the audio is confidently English, which is the one
        // case the base model reliably handles better.
        const detectedEnglish =
          detected?.language === "en" && detected.probability >= 0.6;

        if (detectedEnglish) {
          return transcribeWithFasterWhisper(audioPath, outDir, {
            ...settings,
            language: detected.language,
          });
        }

        const khmer = await transcribeWithFasterWhisper(audioPath, outDir, {
          ...settings,
          model: khmerModel,
          language: "km",
        });

        // The fine-tune sometimes loops on one glyph for non-Khmer audio. When
        // that happens the base model's language detection decides the language
        // instead, so the caption and title layers stay readable.
        if (khmerHallucination(khmer.segments)) {
          console.warn(
            "[transcribe] Khmer model produced repeated-glyph output; using base model"
          );
          return transcribeWithFasterWhisper(audioPath, outDir, {
            ...settings,
            language: detected?.language ?? "auto",
          });
        }

        return khmer;
      }

      // If language was defaulted to "en" or "auto", but the audio is detected as Khmer:
      if (khmerAvailable && settings.language !== "km") {
        let detected = null;
        try {
          detected = await detectLanguage(audioPath, outDir, settings.model);
        } catch {}

        const likelyKhmer =
          detected?.language === "km" ||
          (detected?.language === "th" && (detected.probability ?? 1) < 0.5);

        if (likelyKhmer) {
          try {
            const khmer = await transcribeWithFasterWhisper(audioPath, outDir, {
              ...settings,
              model: khmerModel,
              language: "km",
            });
            if (!khmerHallucination(khmer.segments) && khmer.words.length > 0) {
              return khmer;
            }
          } catch (e) {
            console.warn(
              `[transcribe] auto-Khmer transcribe fallback failed: ${e.message}`
            );
          }
        }
      }

      let result = await transcribeWithFasterWhisper(
        audioPath,
        outDir,
        settings
      );

      const shouldRetryKhmer =
        khmerAvailable &&
        settings.language !== "km" &&
        (result.language === "km" || usesKhmerScript(result.words));

      if (shouldRetryKhmer) {
        try {
          const khmer = await transcribeWithFasterWhisper(audioPath, outDir, {
            ...settings,
            model: khmerModel,
            language: "km",
          });
          if (!khmerHallucination(khmer.segments)) {
            result = khmer;
          } else {
            console.warn(
              "[transcribe] Khmer retry produced repeated-glyph output; keeping base result"
            );
          }
        } catch (error) {
          console.warn(
            `[transcribe] Khmer model retry failed: ${error.message}`
          );
        }
      }

      return result;
    } catch (error) {
      console.warn(
        `[transcribe] faster-whisper failed, falling back to whisper: ${error.message}`
      );
    }
  }

  return transcribeWithWhisperCli(audioPath, outDir, settings);
}
