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

function cleanWord(rawText) {
  let text = String(rawText ?? "").trim();
  if (!text) return "";
  // Collapse invalid duplicate Khmer combining vowels/diacritics (\u17B6 to \u17D3)
  // e.g. \u17B8\u17B8\u17B8 -> \u17B8
  text = text.replace(/([\u17B6-\u17D3])\1+/gu, "$1");
  // Remove replacement characters
  text = text.replace(/\uFFFD/g, "").trim();
  return text;
}

function isNoiseWord(text) {
  if (!text || text.includes("\uFFFD")) return true;
  // 5+ identical consecutive characters is noise/hallucination
  if (/(.)\1{4,}/u.test(text)) return true;
  // Isolated Khmer combining signs without any base consonant is noise
  if (/^[\u17B6-\u17D3\u17D2]+$/u.test(text)) return true;
  return false;
}

function parseTranscript(payload) {
  const words = [];

  for (const segment of payload.segments ?? []) {
    if (Array.isArray(segment.words) && segment.words.length > 0) {
      for (const word of segment.words) {
        const text = cleanWord(word.word);
        if (!text || isNoiseWord(text)) continue;

        // Skip 3+ repetitions of the exact same word in a row
        const last = words[words.length - 1];
        const prev = words[words.length - 2];
        if (last && prev && last.text === text && prev.text === text) {
          continue;
        }

        const start = Number(word.start);
        const end = Number(word.end);
        words.push({
          text,
          start: Number.isFinite(start) ? start : 0,
          end: Number.isFinite(end) ? end : Number.isFinite(start) ? start : 0,
        });
      }
      continue;
    }

    const tokens = String(segment.text ?? "")
      .trim()
      .split(/\s+/)
      .map(cleanWord)
      .filter((token) => token && !isNoiseWord(token));
    if (tokens.length === 0) continue;

    const start = Number(segment.start) || 0;
    const end = Number(segment.end) || start;
    const step = tokens.length > 0 ? (end - start) / tokens.length : 0;
    tokens.forEach((token, index) => {
      const last = words[words.length - 1];
      const prev = words[words.length - 2];
      if (last && prev && last.text === token && prev.text === token) {
        return;
      }
      words.push({
        text: token,
        start: start + index * step,
        end: start + (index + 1) * step,
      });
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
  return parseTranscript(payload);
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
  return parseTranscript(payload);
}

function usesKhmerScript(words) {
  return words.some((word) => KHMER_SCRIPT.test(word.text));
}

export async function transcribe(audioPath, outDir, options = {}) {
  const settings = {
    model: options.model ?? "base",
    language: options.language ?? "auto",
    duration: options.duration,
    onProgress: options.onProgress,
  };

  if (await hasFasterWhisper()) {
    const khmerModel =
      options.khmerModel ??
      process.env.WHISPER_MODEL_KM ??
      defaultKhmerModel;
    const khmerAvailable = existsSync(path.join(khmerModel, "model.bin"));
    const fastSettings = {
      ...settings,
      model:
        settings.language === "km" && khmerAvailable
          ? khmerModel
          : settings.model,
    };

    try {
      let result = await transcribeWithFasterWhisper(
        audioPath,
        outDir,
        fastSettings
      );

      const shouldRetryKhmer =
        khmerAvailable &&
        fastSettings.model !== khmerModel &&
        (settings.language === "km" || result.language === "km" || usesKhmerScript(result.words));

      if (shouldRetryKhmer) {
        try {
          result = await transcribeWithFasterWhisper(audioPath, outDir, {
            ...settings,
            model: khmerModel,
            language: "km",
          });
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
