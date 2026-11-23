const STYLE_PRESETS = {
  bold: {
    font: "Arial",
    // Khmer variants of each preset, used when the cue is in Khmer script.
    khmerFont: "Kantumruy Pro",
    sizeRatio: 0.046,
    khmerSizeRatio: 0.048,
    bold: -1,
    outlineRatio: 0.0032,
    shadow: 0,
    borderStyle: 1,
    marginRatio: 0.12,
    backColour: "&H00000000",
    uppercase: true,
  },
  clean: {
    font: "Arial",
    khmerFont: "Kantumruy Pro",
    sizeRatio: 0.041,
    khmerSizeRatio: 0.044,
    bold: 0,
    outlineRatio: 0.0022,
    shadow: 1,
    borderStyle: 1,
    marginRatio: 0.1,
    backColour: "&H00000000",
    uppercase: false,
  },
  boxed: {
    font: "Arial",
    khmerFont: "Kantumruy Pro",
    sizeRatio: 0.041,
    khmerSizeRatio: 0.044,
    bold: -1,
    outlineRatio: 0.012,
    shadow: 0,
    borderStyle: 3,
    marginRatio: 0.12,
    backColour: "&H80000000",
    uppercase: false,
  },
  karaoke: {
    font: "Arial",
    khmerFont: "Kantumruy Pro",
    sizeRatio: 0.047,
    khmerSizeRatio: 0.050,
    bold: -1,
    outlineRatio: 0.0035,
    shadow: 0,
    borderStyle: 1,
    marginRatio: 0.12,
    backColour: "&H00000000",
    uppercase: true,
  },
};

const SIZE_SCALES = {
  small: 0.85,
  medium: 1,
  large: 1.15,
};

// Khmer text packs more densely and stacks vowels, so a Latin-sized line
// overflows the frame. These bound how much text lands on one line.
const KHMER_MAX_CHARS = 24;

// Khmer cluster boundaries, as code points:
//   1780-17A2  base consonants (including the independent vowels)
//   17A3-17B3  dependent vowels and diacritics that attach to a base
//   17B4-17D3  more vowels, diacritics and punctuation that attach
//   17D2       coeng, which must be followed by the subscript consonant
function isKhmerBase(char) {
  const code = char?.codePointAt(0) ?? 0;
  return code >= 0x1780 && code <= 0x17a2;
}

function isKhmerAttach(char) {
  const code = char?.codePointAt(0) ?? 0;
  if (code === 0x17d2) return false;
  return code >= 0x17a3 && code <= 0x17d3;
}

const DEFAULT_CAPTION_COLORS = {
  text: "#ffffff",
  highlight: "#c7ff3e",
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const KHMER_SCRIPT = /[\u1780-\u17FF]/;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function usesKhmer(language, cues) {
  if (language === "km") return true;
  return cues.some((cue) => KHMER_SCRIPT.test(cue.text));
}

function joinWords(words, khmer) {
  return words
    .filter(Boolean)
    .map((word, index) => {
      const space = index > 0 && (!khmer || word.spaceBefore) ? " " : "";
      return `${space}${word.text}`;
    })
    .join("");
}

// Splits Khmer text into wrap units. A unit is a base consonant plus
// everything attached to it (coeng + subscript, vowels, diacritics), or a
// word-sized run of Latin characters and digits. Breaking between units can
// never separate a consonant from its vowel or subscript.
function khmerWrapUnits(text) {
  const units = [];
  const chars = Array.from(text);
  let index = 0;

  const push = (value, breakable) => {
    if (!value) return;
    units.push({ text: value, breakable });
  };

  while (index < chars.length) {
    const char = chars[index];

    if (/\s/.test(char)) {
      push(" ", true);
      index += 1;
      continue;
    }

    if (char === "\u17D2") {
      // Lone coeng: take it with the subscript that follows.
      push(char + (chars[index + 1] ?? ""), false);
      index += 2;
      continue;
    }

    if (isKhmerBase(char)) {
      let cluster = char;
      index += 1;
      while (index < chars.length) {
        const next = chars[index];
        if (next === "\u17D2") {
          cluster += next;
          index += 1;
          if (index < chars.length) {
            cluster += chars[index];
            index += 1;
          }
          continue;
        }
        if (isKhmerAttach(next)) {
          cluster += next;
          index += 1;
          continue;
        }
        break;
      }
      push(cluster, true);
      continue;
    }

    if (isKhmerAttach(char)) {
      // Orphan vowel or diacritic: glue it to the unit before it.
      if (units.length > 0) {
        units[units.length - 1].text += char;
      } else {
        push(char, true);
      }
      index += 1;
      continue;
    }

    // Latin word, number or punctuation run.
    let run = char;
    index += 1;
    while (index < chars.length) {
      const next = chars[index];
      if (/[\s\u1780-\u17FF]/.test(next)) break;
      run += next;
      index += 1;
    }
    push(run, false);
  }

  return units;
}

const kmSegmenter =
  typeof Intl !== "undefined" && Intl.Segmenter
    ? new Intl.Segmenter("km", { granularity: "word" })
    : null;

// Greedy fill of `maxChars` characters per line, only ever breaking between
// whole words/units and preferring a space over a mid-word break.
function wrapKhmer(text, maxChars) {
  if (kmSegmenter) {
    const segments = Array.from(kmSegmenter.segment(text)).map((s) => s.segment);
    const lines = [];
    let current = "";
    let currentLength = 0;

    for (const segment of segments) {
      if (/\s/.test(segment)) {
        if (currentLength > 0) {
          current += " ";
          currentLength += 1;
        }
        continue;
      }
      const segLength = Array.from(segment).length;
      if (currentLength > 0 && currentLength + segLength > maxChars) {
        lines.push(current.trim());
        current = segment;
        currentLength = segLength;
      } else {
        current += segment;
        currentLength += segLength;
      }
    }
    if (current.trim()) {
      lines.push(current.trim());
    }
    if (lines.length > 0) return lines;
  }

  const units = khmerWrapUnits(text);
  const lines = [];
  let current = "";
  let currentLength = 0;

  const flush = () => {
    const line = current.trim();
    if (line) lines.push(line);
    current = "";
    currentLength = 0;
  };

  for (let i = 0; i < units.length; i += 1) {
    const unit = units[i];
    const length = Array.from(unit.text).length;
    const isSpace = /^\s+$/.test(unit.text);

    if (isSpace) {
      if (currentLength > 0) {
        current += " ";
        currentLength += 1;
      }
      continue;
    }

    // A single unit wider than the line has to be split by character.
    if (length > maxChars) {
      flush();
      const chars = Array.from(unit.text);
      while (chars.length > maxChars) {
        lines.push(chars.slice(0, maxChars).join(""));
        chars.splice(0, maxChars);
      }
      current = chars.join("");
      currentLength = chars.length;
      continue;
    }

    if (currentLength > 0 && currentLength + 1 + length > maxChars) {
      const lastBreak = current.lastIndexOf(" ");
      if (unit.breakable && lastBreak > 0) {
        // Move the trailing word to the next line instead of splitting it.
        const carry = current.slice(lastBreak + 1);
        current = current.slice(0, lastBreak);
        flush();
        current = `${carry} ${unit.text}`;
        currentLength = Array.from(current).length;
        continue;
      }
      flush();
      current = unit.text;
      currentLength = length;
      continue;
    }

    current += unit.text;
    currentLength += length;
  }

  flush();

  return lines.length > 0 ? lines : [text.trim()];
}

function wrapText(text, maxChars, khmer) {
  if (Array.from(text).length <= maxChars) return text;

  if (khmer) return wrapKhmer(text, maxChars).join("\\N");

  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= maxChars) {
      currentLine += ` ${word}`;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  const finalLines = [];
  for (const line of lines) {
    if (line.length <= maxChars) {
      finalLines.push(line);
      continue;
    }
    let remaining = line;
    while (remaining.length > maxChars) {
      const breakAt = maxChars;
      finalLines.push(remaining.slice(0, breakAt).trim());
      remaining = remaining.slice(breakAt).trim();
    }
    if (remaining) finalLines.push(remaining);
  }

  return finalLines.join("\\N");
}

export function buildCues(words, start, end, language) {
  const cues = [];
  let group = [];
  const khmer = language === "km" || words.some((w) => KHMER_SCRIPT.test(w.text));

  // Khmer text packs more densely, limit group size to prevent overcrowding
  const maxGroupWords = khmer ? 5 : 6;
  const maxGroupDuration = khmer ? 2.0 : 2.8;

  const flush = () => {
    if (group.length === 0) return;
    const text = joinWords(group, khmer)
      .replace(/\s{2,}/g, " ")
      .trim();
    const cueStart = clamp(group[0].start - start, 0, end - start);
    const cueEnd = clamp(
      group[group.length - 1].end - start,
      0,
      end - start
    );
    if (text && cueEnd > cueStart) {
      cues.push({
        start: cueStart,
        end: cueEnd,
        text,
        words: group.map((word) => ({
          text: word.text,
          spaceBefore: word.spaceBefore,
          start: clamp(word.start - start, cueStart, cueEnd),
          end: clamp(word.end - start, cueStart, cueEnd),
        })),
      });
    }
    group = [];
  };

  for (const word of words) {
    if (word.end <= start + 0.05 || word.start >= end - 0.05) continue;

    const previous = group[group.length - 1];
    if (previous && word.start - previous.end > 0.7) {
      flush();
    }

    group.push(word);

    if (
      group.length >= maxGroupWords ||
      word.end - group[0].start >= maxGroupDuration ||
      /[.!?\u3002\u17D4\u17D5]$/.test(word.text)
    ) {
      flush();
    }
  }

  flush();

  return cues.filter((cue) => cue.end - cue.start >= 0.15);
}

function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

function srtTime(seconds) {
  const total = Math.max(0, seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  const millis = Math.round((total - Math.floor(total)) * 1000);
  const adjusted = millis === 1000 ? { secs: secs + 1, millis: 0 } : { secs, millis };
  return `${pad(hours)}:${pad(minutes)}:${pad(adjusted.secs)},${pad(adjusted.millis, 3)}`;
}

function assTime(seconds) {
  const total = Math.max(0, seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  const centis = Math.round((total - Math.floor(total)) * 100);
  const adjusted = centis === 100 ? { secs: secs + 1, centis: 0 } : { secs, centis };
  return `${hours}:${pad(minutes)}:${pad(adjusted.secs)}.${pad(adjusted.centis)}`;
}

function escapeAss(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "(")
    .replace(/\}/g, ")")
    .replace(/\r?\n/g, " ");
}

function styleFor(name) {
  return STYLE_PRESETS[name] ?? STYLE_PRESETS.bold;
}

function normalizeColor(value, fallback) {
  return typeof value === "string" && HEX_COLOR.test(value.trim())
    ? value.trim()
    : fallback;
}

function assColor(hex) {
  const value = hex.slice(1).toUpperCase();
  return `&H00${value.slice(4, 6)}${value.slice(2, 4)}${value.slice(0, 2)}`;
}

function karaokeTimeline(cue) {
  const words = cue.words ?? [];
  if (words.length === 0) {
    return [{ start: cue.start, end: cue.end, index: 0 }];
  }

  const starts = words.map((word) =>
    clamp(word.start, cue.start, cue.end)
  );
  for (let index = 1; index < starts.length; index += 1) {
    starts[index] = Math.max(starts[index], starts[index - 1] + 0.01);
  }

  const events = [];
  for (let index = 0; index < words.length; index += 1) {
    const start = index === 0 ? cue.start : starts[index];
    const end = index + 1 < words.length ? starts[index + 1] : cue.end;
    if (end > start + 0.02) {
      events.push({ start, end, index });
    }
  }

  return events.length > 0
    ? events
    : [{ start: cue.start, end: cue.end, index: 0 }];
}

function karaokeEventText(cue, activeIndex, options) {
  let lineLen = 0;
  const maxLine = options.khmer ? KHMER_MAX_CHARS : 40;
  let linesCount = 1;

  return (cue.words ?? [])
    .map((word, wordIndex) => {
      const color = assColor(
        wordIndex === activeIndex ? options.highlight : options.text
      );
      const text = options.uppercase ? word.text.toUpperCase() : word.text;
      const wordLen = Array.from(text).length;
      let prefix = "";
      if (wordIndex > 0) {
        if (lineLen + wordLen > maxLine && linesCount < MAX_CAPTION_LINES) {
          prefix = "\\N";
          lineLen = 0;
          linesCount += 1;
        } else if (!options.khmer || word.spaceBefore) {
          prefix = " ";
          lineLen += 1;
        }
      }
      lineLen += wordLen;
      return `${prefix}{\\1c${color}}${escapeAss(text)}`;
    })
    .join("");
}

const MAX_CAPTION_LINES = 2;

// ASS draws \N at the natural line height for the style, so the wrap count is
// what decides whether captions spill off the top of a vertical frame.
function limitLines(text, maxLines) {
  const lines = text.split("\\N");
  if (lines.length <= maxLines) return text;
  const kept = lines.slice(0, maxLines);
  const last = Array.from(kept[maxLines - 1]);
  kept[maxLines - 1] = `${last.slice(0, Math.max(1, last.length - 1)).join("")}…`;
  return kept.join("\\N");
}

export function cuesToSrt(cues) {
  return `${cues
    .map(
      (cue, index) =>
        `${index + 1}\n${srtTime(cue.start)} --> ${srtTime(cue.end)}\n${cue.text}\n`
    )
    .join("\n")}`;
}

export function cuesToAss(cues, options) {
  const { width, height, captionStyle, captionSize, language, captionColors } =
    options;
  const style = styleFor(captionStyle);
  const karaoke = captionStyle === "karaoke";
  const sizeScale = SIZE_SCALES[captionSize] ?? SIZE_SCALES.medium;
  const khmer = usesKhmer(language, cues);
  const fontName = khmer ? style.khmerFont : style.font;
  const maxChars = khmer ? KHMER_MAX_CHARS : 44;
  const textColor = normalizeColor(
    captionColors?.text,
    DEFAULT_CAPTION_COLORS.text
  );
  const highlightColor = normalizeColor(
    captionColors?.highlight,
    DEFAULT_CAPTION_COLORS.highlight
  );
  const sizeRatio = (khmer ? style.khmerSizeRatio : style.sizeRatio) * sizeScale;
  const fontSize = Math.max(18, Math.round(height * sizeRatio));
  // Kantumruy Pro's strokes are wider than Arial's, so a Latin outline eats
  // into the glyph counters and the highlight colour stops reading.
  const outline = Math.max(
    1,
    Math.round(height * style.outlineRatio * (khmer ? 0.62 : 1))
  );
  const marginV = Math.round(height * style.marginRatio * (khmer ? 1.08 : 1));
  const spacing = 0;

  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,${fontName},${fontSize},${assColor(textColor)},${assColor(highlightColor)},&H00000000,${style.backColour},${style.bold},0,0,0,100,100,${spacing},0,${style.borderStyle},${outline},${style.shadow},2,48,48,${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];

  const events = [];
  for (const cue of cues) {
    if (karaoke && cue.words?.length) {
      for (const timeline of karaokeTimeline(cue)) {
        const text = karaokeEventText(cue, timeline.index, {
          uppercase: style.uppercase,
          text: textColor,
          highlight: highlightColor,
          khmer,
        });
        events.push(
          `Dialogue: 0,${assTime(timeline.start)},${assTime(timeline.end)},Default,,0,0,0,,${text}`
        );
      }
      continue;
    }

    const text = limitLines(
      wrapText(
        escapeAss(style.uppercase ? cue.text.toUpperCase() : cue.text),
        maxChars,
        khmer
      ),
      MAX_CAPTION_LINES
    );
    events.push(
      `Dialogue: 0,${assTime(cue.start)},${assTime(cue.end)},Default,,0,0,0,,${text}`
    );
  }

  return `${header.concat(events).join("\n")}\n`;
}
