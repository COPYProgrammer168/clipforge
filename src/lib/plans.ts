export const MAX_SOURCE_SECONDS = 2 * 60 * 60;
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

export const ASPECT_RATIOS = ["9:16", "1:1", "16:9", "random"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const ASPECT_RATIO_LABELS: Record<AspectRatio, string> = {
  "9:16": "9:16",
  "1:1": "1:1",
  "16:9": "16:9",
  random: "Random",
};

export const CAPTION_STYLE_VARIANTS = [
  "bold",
  "clean",
  "boxed",
  "karaoke",
] as const;
export type CaptionStyleVariant = (typeof CAPTION_STYLE_VARIANTS)[number];

export const CAPTION_STYLES = [...CAPTION_STYLE_VARIANTS, "random"] as const;
export type CaptionStyle = (typeof CAPTION_STYLES)[number];

export const CAPTION_STYLE_LABELS: Record<CaptionStyle, string> = {
  bold: "Bold",
  clean: "Clean",
  boxed: "Boxed",
  karaoke: "Karaoke",
  random: "Random",
};

export const CAPTION_SIZES = ["small", "medium", "large"] as const;
export type CaptionSize = (typeof CAPTION_SIZES)[number];

export const CAPTION_SIZE_LABELS: Record<CaptionSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export const DEFAULT_CAPTION_SIZE: CaptionSize = "medium";


export const BACKGROUND_MODES = ["crop", "blur", "webcam", "random"] as const;
export type BackgroundMode = (typeof BACKGROUND_MODES)[number];

export const BACKGROUND_LABELS: Record<BackgroundMode, string> = {
  crop: "Crop",
  blur: "Blur",
  webcam: "Webcam split",
  random: "Random",
};

export const BACKGROUND_DETAILS: Record<BackgroundMode, string> = {
  crop: "Fills the frame with a center crop.",
  blur: "Fits the whole frame over a blurred fill of the same video.",
  webcam:
    "Detects a facecam and stacks the webcam above the gameplay. Falls back to a center crop when no webcam is found.",
  random:
    "Mixes center crop, blurred fill, and the webcam split when a facecam is detected.",
};

export const CLIP_TIMES = ["auto", "short", "long", "random"] as const;
export type ClipTime = (typeof CLIP_TIMES)[number];

export const CLIP_TIME_LABELS: Record<ClipTime, string> = {
  auto: "Auto",
  short: "Short",
  long: "Long",
  random: "Random",
};

export const CLIP_TIME_DETAILS: Record<ClipTime, string> = {
  auto: "Uses the worker's default clip window bounds.",
  short: "Keeps every clip short, around 10–25 seconds.",
  long: "Pulls longer moments, around 40–90 seconds.",
  random: "Mixes short, medium and long clips across the job.",
};

export type CaptionColors = {
  text: string;
  highlight: string;
};

export const DEFAULT_CAPTION_COLORS: CaptionColors = {
  text: "#ffffff",
  highlight: "#c7ff3e",
};

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "km", label: "Khmer" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["value"];
