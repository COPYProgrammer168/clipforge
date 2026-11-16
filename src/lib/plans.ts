export const MAX_SOURCE_SECONDS = 2 * 60 * 60;
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

export const ASPECT_RATIOS = ["9:16", "1:1", "16:9"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const CAPTION_STYLES = ["bold", "clean", "boxed"] as const;
export type CaptionStyle = (typeof CAPTION_STYLES)[number];

export const LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "nl", label: "Dutch" },
  { value: "pl", label: "Polish" },
  { value: "tr", label: "Turkish" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "vi", label: "Vietnamese" },
  { value: "km", label: "Khmer" },
] as const;
