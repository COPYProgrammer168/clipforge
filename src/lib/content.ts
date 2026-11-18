export type NavLink = {
  label: string;
  href: string;
  description?: string;
};

export const faqs = [
  {
    q: "How does ClipForge pick the clips?",
    a: "The worker transcribes the recording with word-level timestamps, groups the transcript into sentence-aligned windows, and scores each window on hook language, keyword density, speaking pace, emotional language and length fit. It then keeps the highest-scoring windows that do not overlap. Scoring is deterministic and runs offline.",
  },
  {
    q: "What can I upload?",
    a: "Upload MP4, MOV, WebM, MKV, M4V or AVI files up to 2 GB and 2 hours, or paste a public video link. Uploaded sources are removed from storage after a successful job. Links must be public and downloadable.",
  },
  {
    q: "Which languages are supported?",
    a: "The transcription model can auto-detect language, and the studio lets you choose English, Spanish, Portuguese, French, German, Italian, Dutch, Polish, Turkish, Japanese, Korean, Vietnamese or Khmer. Khmer uses a dedicated fine-tuned speech model.",
  },
  {
    q: "Can I edit the captions and cuts?",
    a: "Every finished clip includes an MP4 with burned-in captions, an SRT sidecar and a thumbnail. The studio currently does not expose a timeline editor, so trim and caption restyling happen by creating a new job with different settings.",
  },
  {
    q: "Do I need an account?",
    a: "No. Open the studio and start working. ClipForge runs a single shared workspace, so there is no sign-up, login or password to manage. Every feature is unlimited while the product is in beta.",
  },
  {
    q: "Where are my files stored?",
    a: "Job and clip metadata live in the configured database (SQLite by default, or hosted libSQL/Turso). Rendered MP4s, SRT files and thumbnails stay on local disk, or are published to Cloudflare R2 when CLIP_STORAGE=r2. Uploaded source files use R2. Deleting a job removes its rendered clips and uploaded source.",
  },
];

export type ProductPage = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  highlights: { title: string; description: string }[];
  steps: { title: string; description: string }[];
  stats: { value: string; label: string }[];
};

export const productPages: Record<string, ProductPage> = {
  "smart-clips": {
    slug: "smart-clips",
    eyebrow: "Clipping engine",
    title: "Find up to ten complete moments.",
    description:
      "ClipForge transcribes the whole recording, splits it into sentence-aligned windows and ranks them with offline scoring. No LLM, no random slicing.",
    highlights: [
      {
        title: "Sentence-aligned windows",
        description:
          "Each candidate starts and ends on a transcript sentence instead of an arbitrary timestamp, so clips open and close on complete thoughts.",
      },
      {
        title: "Deterministic scoring",
        description:
          "Hook language, keyword density, speaking pace, emotional words and length fit are scored locally. The same transcript always produces the same ranking.",
      },
      {
        title: "Overlap removed",
        description:
          "Selected windows are checked against each other, so the final set does not repeat the same moment under a different title.",
      },
    ],
    steps: [
      {
        title: "Drop the source",
        description:
          "Upload a file up to 2 GB or paste a public link. The worker downloads it and probes the duration and audio track.",
      },
      {
        title: "Transcribe and rank",
        description:
          "Whisper produces word-level timing, then the scorer ranks sentence-aligned windows between 20 and 60 seconds.",
      },
      {
        title: "Render and download",
        description:
          "Each pick is rendered with burned-in captions, a thumbnail and an SRT file. The studio links every export.",
      },
    ],
    stats: [
      { value: "10", label: "maximum clips per job" },
      { value: "20-60s", label: "selected clip length" },
      { value: "2h", label: "maximum source length" },
    ],
  },
  "smart-reframe": {
    slug: "smart-reframe",
    eyebrow: "Aspect ratios",
    title: "One recording. Three frame sizes.",
    description:
      "Choose 9:16, 1:1 or 16:9 when you create a job. Fill the frame with a center crop or keep the whole shot over a blurred background, then render at 1080p. There is no face tracking or keyframe pass.",
    highlights: [
      {
        title: "Crop or blurred fill",
        description:
          "Crop fills the frame from the center. Blur scales the whole source to fit and fills the sides with a blurred copy, or randomize the choice per clip.",
      },
      {
        title: "One ratio per job",
        description:
          "The ratio is part of the job options. To get another format, create a second job with a different ratio from the same source.",
      },
      {
        title: "Captions stay attached",
        description:
          "Every ratio renders with the caption style you chose, plus a matching SRT file and thumbnail.",
      },
    ],
    steps: [
      {
        title: "Pick the ratio",
        description: "Choose vertical 9:16, square 1:1 or widescreen 16:9 in the new clip dialog.",
      },
      {
        title: "Render at 1080p",
        description: "The worker crops or blurs the background, then burns in the caption track.",
      },
      {
        title: "Download the set",
        description: "The job page provides the MP4, SRT and thumbnail for every rendered clip.",
      },
    ],
    stats: [
      { value: "9:16", label: "vertical" },
      { value: "1:1", label: "square" },
      { value: "16:9", label: "widescreen" },
    ],
  },
  captions: {
    slug: "captions",
    eyebrow: "Captions",
    title: "Burned in, with the SRT to match.",
    description:
      "Whisper supplies word-level timing. ClipForge turns it into four caption presets, including vertical karaoke with per-word highlighting and custom colors, and exports both a captioned MP4 and a clean SRT.",
    highlights: [
      {
        title: "Four presets",
        description:
          "Bold, Clean, Boxed and Karaoke are rendered with ffmpeg and ASS. Pick one per job; the worker applies it to every clip.",
      },
      {
        title: "Karaoke timing",
        description:
          "Karaoke keeps the line on screen and colors each word as it is spoken, using the transcript's word timestamps.",
      },
      {
        title: "Custom colors",
        description:
          "Choose the caption text color and the active-word highlight color for every job. Captions appear only when speech is detected.",
      },
    ],
    steps: [
      {
        title: "Transcribe automatically",
        description: "The worker extracts audio and runs speech-to-text with word timestamps.",
      },
      {
        title: "Choose a style",
        description: "Select Bold, Clean, Boxed or Karaoke and pick the caption colors.",
      },
      {
        title: "Take both files",
        description: "Download the MP4 with captions burned in and the SRT sidecar for reuse.",
      },
    ],
    stats: [
      { value: "4", label: "caption presets" },
      { value: "Karaoke", label: "word highlight" },
      { value: "MP4+SRT", label: "every export" },
    ],
  },
  "team-workspace": {
    slug: "team-workspace",
    eyebrow: "Shared workspace",
    title: "One queue. No account required.",
    description:
      "Every visitor to a deployment uses the same Postgres-backed workspace. Jobs, progress and exports persist without sign-up. Keep the deployment private because there is no access control.",
    highlights: [
      {
        title: "No sign-in",
        description:
          "The studio resolves every request to one workspace user, so there are no invites, sessions or passwords to manage.",
      },
      {
        title: "SQLite-backed queue",
        description:
          "Jobs are stored in SQLite with status, stage and progress. The worker claims them with row locks and writes clips back.",
      },
      {
        title: "Private by deployment",
        description:
          "There is no per-user isolation. Run ClipForge locally or behind your own access control before exposing it publicly.",
      },
    ],
    steps: [
      {
        title: "Open the workspace",
        description: "Go to /studio. The workspace user is created on first use if it does not exist.",
      },
      {
        title: "Queue work",
        description: "Upload a file or paste a link. The source and job options are stored together.",
      },
      {
        title: "Watch the queue",
        description: "The dashboard polls job progress until clips are ready to download.",
      },
    ],
    stats: [
      { value: "Unlimited", label: "processing minutes" },
      { value: "1080p", label: "rendered exports" },
      { value: "3", label: "aspect ratios" },
    ],
  },
};

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Clipping engine", href: "/smart-clips" },
      { label: "Aspect ratios", href: "/smart-reframe" },
      { label: "Captions", href: "/captions" },
      { label: "Access", href: "/pricing" },
    ],
  },
  {
    title: "Workspace",
    links: [
      { label: "Shared workspace", href: "/team-workspace" },
      { label: "Open studio", href: "/studio" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How clipping works", href: "/smart-clips#how-it-works" },
      { label: "Caption presets", href: "/captions" },
      { label: "Legal", href: "/legal" },
    ],
  },
];
