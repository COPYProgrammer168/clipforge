import { readFile } from "node:fs/promises";
import { parseTranscript } from "./transcribe.mjs";

const KHMER_SCRIPT = /[\u1780-\u17FF]/;
const MAX_CUE_SECONDS = 30;
const MIN_CUE_SECONDS = 0.35;

function parseTimestamp(value) {
  const parts = value.split(":");
  if (parts.length !== 3) return null;
  const seconds = Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  return Number.isFinite(seconds) ? seconds : null;
}

function cleanCaptionText(raw, language) {
  let text = String(raw ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-f]+);/gi, " ")
    .replace(/\u200B/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/^[\u17B4-\u17D3\u17D2]+/u, "")
    .replace(/(\u17D7)\1+/gu, "$1")
    .replace(/([\u17B6-\u17D3])\1+/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (language === "km" && !KHMER_SCRIPT.test(text)) return "";
  return text;
}

function normalizeCues(text, language) {
  const cues = [];
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block.split("\n");
    const timeIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeIndex === -1) continue;

    const match = lines[timeIndex].match(
      /(\d{1,2}:\d{2}:\d{2}(?:\.\d+)?)\s*-->\s*(\d{1,2}:\d{2}:\d{2}(?:\.\d+)?)/
    );
    if (!match) continue;

    const start = parseTimestamp(match[1]);
    const end = parseTimestamp(match[2]);
    if (
      start === null ||
      end === null ||
      end - start < MIN_CUE_SECONDS ||
      end - start > MAX_CUE_SECONDS
    ) {
      continue;
    }

    const body = lines
      .slice(timeIndex + 1)
      .map((line) => cleanCaptionText(line, language))
      .filter(Boolean)
      .join(" ");

    const cleaned = cleanCaptionText(body, language);
    if (!cleaned) continue;

    cues.push({ start, end, text: cleaned });
  }

  cues.sort((a, b) => a.start - b.start);

  // YouTube auto captions scroll: each cue repeats the previous line and adds
  // new words. Keep only the newly spoken suffix so words are not duplicated.
  const deduped = [];
  let previous = "";
  for (const cue of cues) {
    if (cue.text === previous) continue;

    let text = cue.text;
    if (previous && text.startsWith(previous)) {
      text = text.slice(previous.length).trim();
    }

    previous = cue.text;
    if (!text) continue;

    deduped.push({ start: cue.start, end: cue.end, text });
  }

  return deduped;
}

export async function sourceCaptionsToTranscript(files, language) {
  let best = null;

  for (const file of files ?? []) {
    try {
      const text = await readFile(file, "utf8");
      // Detect language from file path or content if it is Khmer
      const isKhmerFile =
        /\bkm(-orig)?\.vtt$/i.test(file) || KHMER_SCRIPT.test(text);
      const fileLang = isKhmerFile ? "km" : language;

      const cues = normalizeCues(text, fileLang);
      if (cues.length === 0) continue;

      const transcript = parseTranscript(
        { language: fileLang, segments: cues },
        fileLang
      );
      if (!transcript || transcript.words.length === 0) continue;

      // Prefer Khmer subtitle file if requested or detected, otherwise prefer more words
      const isPreferred =
        (language === "km" && isKhmerFile) ||
        (isKhmerFile && (!best || best.language !== "km")) ||
        (!best || transcript.words.length > best.words.length);

      if (!best || isPreferred) {
        best = transcript;
      }
    } catch {
      // A missing or malformed subtitle file should never fail the job.
    }
  }

  return best;
}
