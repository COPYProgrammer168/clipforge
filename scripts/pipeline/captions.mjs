const STYLE_PRESETS = {
  bold: {
    font: "Arial",
    sizeRatio: 0.05,
    bold: -1,
    outlineRatio: 0.0032,
    shadow: 0,
    borderStyle: 1,
    marginRatio: 0.13,
    backColour: "&H00000000",
    uppercase: true,
  },
  clean: {
    font: "Arial",
    sizeRatio: 0.045,
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
    sizeRatio: 0.045,
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
    sizeRatio: 0.056,
    bold: -1,
    outlineRatio: 0.0035,
    shadow: 0,
    borderStyle: 1,
    marginRatio: 0.22,
    backColour: "&H00000000",
    uppercase: true,
  },
};

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

function wrapText(text, maxChars) {
  if (text.length <= maxChars) return text;

  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (!word) continue;
    if (!line) {
      line = word;
    } else if (line.length + 1 + word.length <= maxChars) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  const wrapped = [];
  for (const entry of lines) {
    if (entry.length <= maxChars) {
      wrapped.push(entry);
      continue;
    }
    for (let index = 0; index < entry.length; index += maxChars) {
      wrapped.push(entry.slice(index, index + maxChars));
    }
  }

  return wrapped.join("\\N");
}

export function buildCues(words, start, end) {
  const cues = [];
  let group = [];

  const flush = () => {
    if (group.length === 0) return;
    const text = group
      .map((word) => word.text)
      .join(" ")
      .replace(/\s+/g, " ")
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
      group.length >= 6 ||
      word.end - group[0].start >= 3 ||
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
  return (cue.words ?? [])
    .map((word, wordIndex) => {
      const color = assColor(
        wordIndex === activeIndex ? options.highlight : options.text
      );
      const text = options.uppercase ? word.text.toUpperCase() : word.text;
      return `{\\1c${color}}${escapeAss(text)}`;
    })
    .join(" ");
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
  const { width, height, captionStyle, language, captionColors } = options;
  const style = styleFor(captionStyle);
  const karaoke = captionStyle === "karaoke";
  const khmer = usesKhmer(language, cues);
  const fontName = khmer ? "Noto Sans Khmer" : style.font;
  const maxChars = khmer ? 26 : 44;
  const textColor = normalizeColor(
    captionColors?.text,
    DEFAULT_CAPTION_COLORS.text
  );
  const highlightColor = normalizeColor(
    captionColors?.highlight,
    DEFAULT_CAPTION_COLORS.highlight
  );
  const fontSize = Math.max(18, Math.round(height * style.sizeRatio));
  const outline = Math.max(2, Math.round(height * style.outlineRatio));
  const marginV = Math.round(height * style.marginRatio);

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
    `Style: Default,${fontName},${fontSize},${assColor(textColor)},${assColor(highlightColor)},&H00000000,${style.backColour},${style.bold},0,0,0,100,100,0,0,${style.borderStyle},${outline},${style.shadow},2,48,48,${marginV},1`,
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
        });
        events.push(
          `Dialogue: 0,${assTime(timeline.start)},${assTime(timeline.end)},Default,,0,0,0,,${text}`
        );
      }
      continue;
    }

    const text = wrapText(
      escapeAss(style.uppercase ? cue.text.toUpperCase() : cue.text),
      maxChars
    );
    events.push(
      `Dialogue: 0,${assTime(cue.start)},${assTime(cue.end)},Default,,0,0,0,,${text}`
    );
  }

  return `${header.concat(events).join("\n")}\n`;
}
