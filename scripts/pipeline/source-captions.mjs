import { readFile } from "node:fs/promises";
import { parseTranscript } from "./transcribe.mjs";

const KHMER_SCRIPT = /[\u1780-\u17FF]/;
const MAX_CUE_SECONDS = 120;
const MIN_CHUNK_SECONDS = 0.08;
const INLINE_TIMESTAMP = /<(\d{1,2}:\d{2}:\d{2}(?:\.\d+)?)>/g;
const HAS_INLINE_TIMESTAMP = /<(\d{1,2}:\d{2}:\d{2}(?:\.\d+)?)>/;

function parseTimestamp(value) {
  const parts = value.split(":");
  if (parts.length !== 3) return null;
  const seconds = Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  return Number.isFinite(seconds) ? seconds : null;
}

function cleanCaptionText(raw, language, requireScript = true) {
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

  if (requireScript && language === "km" && !KHMER_SCRIPT.test(text)) {
    return "";
  }
  return text;
}

function carryKey(text) {
  return text.replace(/\s+/g, "");
}

function stripCarryPrefix(text, previous) {
  const target = carryKey(previous);
  if (!target) return text;

  let seen = "";
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (!/\s/.test(char)) seen += char;
    if (!target.startsWith(seen)) return text;
    if (seen === target) return text.slice(index + 1).trim();
  }
  return text;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lineChunks(line, cueStart, cueEnd, language, fallbackText) {
  const matches = [...line.matchAll(INLINE_TIMESTAMP)];
  if (matches.length === 0) {
    return fallbackText
      ? [{ start: cueStart, end: cueEnd, text: fallbackText }]
      : [];
  }

  const chunks = [];
  const prefix = cleanCaptionText(
    line.slice(0, matches[0].index),
    language,
    false
  );
  const firstStart = parseTimestamp(matches[0][1]);
  if (prefix && firstStart !== null && firstStart > cueStart) {
    chunks.push({
      start: cueStart,
      end: Math.min(firstStart, cueEnd),
      text: prefix,
    });
  }

  for (let index = 0; index < matches.length; index += 1) {
    const start = parseTimestamp(matches[index][1]);
    const next = matches[index + 1] ?? null;
    const end = next ? parseTimestamp(next[1]) : cueEnd;
    if (start === null || end === null) continue;

    const raw = line.slice(
      matches[index].index + matches[index][0].length,
      next ? next.index : line.length
    );
    const text = cleanCaptionText(raw, language, false);
    if (!text) continue;

    const chunkStart = clamp(start, cueStart, cueEnd);
    const chunkEnd = clamp(end, cueStart, cueEnd);
    chunks.push({
      start: chunkStart,
      end: Math.max(chunkEnd, chunkStart + MIN_CHUNK_SECONDS),
      text,
    });
  }

  return chunks;
}

function normalizeCues(text, language) {
  const chunks = [];
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  let previousLines = new Set();
  let previousKept = "";

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
      end - start < 0.2 ||
      end - start > MAX_CUE_SECONDS
    ) {
      continue;
    }

    const bodyLines = lines.slice(timeIndex + 1);
    const cleanedLines = bodyLines.map((line) =>
      cleanCaptionText(line, language)
    );
    const currentLines = new Set();

    // YouTube auto captions scroll: the first line of a cue repeats the
    // previous cue's newest line. Only the lines after it are new speech.
    for (let index = 0; index < bodyLines.length; index += 1) {
      const cleaned = cleanedLines[index];
      if (!cleaned) continue;

      const key = carryKey(cleaned);
      currentLines.add(key);
      if (previousLines.has(key)) continue;

      let fallbackText = cleaned;
      if (previousKept && !HAS_INLINE_TIMESTAMP.test(bodyLines[index])) {
        fallbackText = stripCarryPrefix(cleaned, previousKept);
        if (!fallbackText) continue;
      }

      chunks.push(
        ...lineChunks(bodyLines[index], start, end, language, fallbackText)
      );
      previousKept = cleaned;
    }

    previousLines = currentLines;
  }

  chunks.sort((a, b) => a.start - b.start);
  return chunks;
}

export async function sourceCaptionsToTranscript(files, language, speech = []) {
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
        fileLang,
        speech
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
