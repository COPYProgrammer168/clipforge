const MIN_WINDOW_SECONDS = 16;
const MAX_WINDOW_SECONDS = 52;
const TARGET_WINDOW_SECONDS = 30;

const HOOK_WORDS = new Set([
  "how",
  "why",
  "what",
  "when",
  "where",
  "who",
  "secret",
  "mistake",
  "never",
  "always",
  "best",
  "worst",
  "stop",
  "start",
  "biggest",
  "fastest",
  "slowest",
  "crazy",
  "insane",
  "actually",
  "truth",
  "nobody",
  "everyone",
  "warning",
  "important",
  "first",
  "last",
  "money",
  "free",
  "easy",
  "hard",
  "you",
  "your",
]);

const EMOTION_WORDS = new Set([
  "amazing",
  "incredible",
  "crazy",
  "insane",
  "awesome",
  "terrible",
  "worst",
  "best",
  "love",
  "hate",
  "wow",
  "shocking",
  "unbelievable",
  "perfect",
  "huge",
  "massive",
  "beautiful",
  "dangerous",
  "fast",
  "slow",
  "epic",
  "wild",
  "favorite",
  "favourite",
  "disaster",
  "brilliant",
]);

const STOP_WORDS = new Set([
  "a",
  "about",
  "after",
  "again",
  "all",
  "also",
  "am",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "but",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "doing",
  "don",
  "down",
  "for",
  "from",
  "get",
  "got",
  "had",
  "has",
  "have",
  "he",
  "her",
  "here",
  "hers",
  "him",
  "his",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "just",
  "like",
  "me",
  "more",
  "most",
  "my",
  "no",
  "not",
  "now",
  "of",
  "off",
  "on",
  "one",
  "only",
  "or",
  "other",
  "our",
  "out",
  "over",
  "own",
  "really",
  "said",
  "same",
  "she",
  "should",
  "so",
  "some",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "up",
  "very",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "will",
  "with",
  "would",
  "you",
  "your",
  "yours",
]);

function normalizeToken(value) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\u2019]/gu, "")
    .replace(/^'+|'+$/g, "");
}

function splitSentences(words) {
  const sentences = [];
  let current = [];

  const flush = () => {
    if (current.length === 0) return;
    sentences.push({
      words: current,
      start: current[0].start,
      end: current[current.length - 1].end,
      text: current.map((word) => word.text).join(" "),
    });
    current = [];
  };

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    current.push(word);
    const next = words[index + 1];
    const gap = next ? next.start - word.end : Number.POSITIVE_INFINITY;
    const terminal = /[.!?\u3002\u17D4\u17D5]$/.test(word.text);

    if (terminal || gap > 0.65 || current.length >= 28) {
      flush();
    }
  }

  flush();
  return sentences;
}

function scoreWindow(words, duration, text, targetSeconds) {
  const tokens = words.map((word) => normalizeToken(word.text)).filter(Boolean);
  if (tokens.length === 0) return 0;

  const totalWords = Math.max(tokens.length, 1);
  const wordsPerSecond = totalWords / Math.max(duration, 1);
  const firstTokens = tokens.slice(0, 14);

  const hookHits = firstTokens.filter((token) => HOOK_WORDS.has(token)).length;
  const startsWithQuestion = /^(how|why|what|when|where|who|is|are|can|do|does)$/.test(
    firstTokens[0] ?? ""
  );
  const hasNumber = firstTokens.some((token) => /\d/.test(token));
  const hook = Math.min(
    1,
    hookHits * 0.22 + (startsWithQuestion ? 0.25 : 0) + (hasNumber ? 0.1 : 0)
  );

  const contentTokens = tokens.filter(
    (token) => token.length > 2 && !STOP_WORDS.has(token)
  );
  const density = contentTokens.length / totalWords;
  const frequencies = new Map();
  for (const token of contentTokens) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }
  const topRepeat = Math.max(0, ...frequencies.values());
  const keywords = Math.min(
    1,
    density * 1.9 + Math.min(0.3, Math.max(0, topRepeat - 1) * 0.1)
  );

  const pace = Math.max(0, 1 - Math.abs(wordsPerSecond - 3.1) / 1.9);

  const emotionHits = tokens.filter((token) => EMOTION_WORDS.has(token)).length;
  const exclamations = (text.match(/!/g) ?? []).length;
  const emotion = Math.min(1, emotionHits * 0.25 + exclamations * 0.1);

  const ending = /[.!?\u3002\u17D4\u17D5]$/.test(text.trim()) ? 1 : 0.9;

  const length = Math.exp(
    -Math.pow(duration - targetSeconds, 2) / (2 * 9 * 9)
  );

  const score =
    100 *
    (0.3 * hook +
      0.2 * keywords +
      0.15 * pace +
      0.15 * emotion +
      0.1 * ending +
      0.1 * length);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildTitle(text, fallback) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;
  const sentence =
    cleaned.split(/(?<=[.!?\u17D4\u17D5])\s/)[0] ?? cleaned;
  if (sentence.length <= 64) return sentence;
  const clipped = sentence.slice(0, 64);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > 32 ? clipped.slice(0, lastSpace) : clipped).trim()}\u2026`;
}

function fallbackPlan(sourceDuration, maxClips, targetSeconds) {
  const duration = Math.max(3, Math.floor(sourceDuration));
  if (duration <= 8) {
    return [
      {
        start: 0,
        end: duration,
        score: 0,
        title: "Highlight 1",
      },
    ];
  }

  const count = Math.max(1, Math.min(maxClips, 6));
  const clipLength = Math.min(
    Math.max(10, targetSeconds),
    Math.max(10, Math.floor(duration / (count + 1)))
  );
  const plan = [];

  for (let index = 0; index < count; index += 1) {
    const center = Math.round((duration * (index + 1)) / (count + 1));
    const start = Math.max(0, Math.min(duration - clipLength, center - Math.floor(clipLength / 2)));
    plan.push({
      start,
      end: Math.min(duration, start + clipLength),
      score: 0,
      title: `Highlight ${index + 1}`,
    });
  }

  return plan;
}

export function transcriptUsable(words, sourceDuration) {
  if (!Array.isArray(words) || words.length < 12) return false;

  const tokens = words.map((word) => normalizeToken(word.text)).filter(Boolean);
  if (tokens.length < 12) return false;

  const frequencies = new Map();
  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  const topRepeat = Math.max(...frequencies.values());
  if (topRepeat / tokens.length > 0.3) return false;
  if (frequencies.size / tokens.length < 0.2) return false;

  const span = Math.max(
    1,
    (words[words.length - 1].end - words[0].start) || sourceDuration
  );
  if (tokens.length / span > 7) return false;

  return true;
}

export function planClips(words, sourceDuration, maxClips, limits = {}) {
  const limit = Math.max(1, Math.min(10, Math.floor(maxClips) || 1));
  const minSeconds = limits.minSeconds ?? MIN_WINDOW_SECONDS;
  const maxSeconds = limits.maxSeconds ?? MAX_WINDOW_SECONDS;
  const targetSeconds = limits.targetSeconds ?? TARGET_WINDOW_SECONDS;
  const sentences = splitSentences(words);

  const candidates = [];
  for (let startIndex = 0; startIndex < sentences.length; startIndex += 1) {
    let endIndex = startIndex;
    while (endIndex < sentences.length) {
      const start = sentences[startIndex].start;
      const end = sentences[endIndex].end;
      const duration = end - start;
      if (duration > maxSeconds) break;

      if (duration >= minSeconds) {
        const windowWords = sentences
          .slice(startIndex, endIndex + 1)
          .flatMap((sentence) => sentence.words);
        const text = sentences
          .slice(startIndex, endIndex + 1)
          .map((sentence) => sentence.text)
          .join(" ");
        candidates.push({
          start,
          end,
          duration,
          text,
          score: scoreWindow(windowWords, duration, text, targetSeconds),
        });
      }

      endIndex += 1;
    }
  }

  const byStart = new Map();
  for (const candidate of candidates) {
    const key = Math.round(candidate.start / 2) * 2;
    const existing = byStart.get(key);
    if (!existing || candidate.score > existing.score) {
      byStart.set(key, candidate);
    }
  }

  const ranked = [...byStart.values()].sort((a, b) => b.score - a.score);
  const picked = [];
  for (const candidate of ranked) {
    if (picked.length >= limit) break;
    const overlaps = picked.some(
      (other) =>
        candidate.start < other.end - 0.25 && candidate.end > other.start + 0.25
    );
    if (!overlaps) picked.push(candidate);
  }

  if (picked.length === 0) {
    return fallbackPlan(sourceDuration, limit, targetSeconds);
  }

  picked.sort((a, b) => a.start - b.start);

  return picked.map((candidate, index) => {
    const start = Math.max(0, Math.round(candidate.start));
    const end = Math.min(
      Math.floor(sourceDuration),
      Math.max(start + 2, Math.round(candidate.end))
    );
    return {
      start,
      end,
      score: candidate.score,
      title: buildTitle(candidate.text, `Highlight ${index + 1}`),
    };
  });
}
