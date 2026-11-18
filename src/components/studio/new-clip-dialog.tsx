"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  FileVideo,
  Info,
  Link2,
  Loader2,
  UploadCloud,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BACKGROUND_MODES,
  CAPTION_STYLES,
  DEFAULT_CAPTION_COLORS,
  LANGUAGES,
  MAX_UPLOAD_BYTES,
  type AspectRatio,
  type BackgroundMode,
  type CaptionColors,
  type CaptionStyle,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function titleFromFilename(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function isVideoFile(file: File) {
  return (
    file.type.startsWith("video/") ||
    /\.(mp4|mov|webm|mkv|m4v|avi)$/i.test(file.name)
  );
}

function uploadToR2(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", contentType);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload to Cloudflare R2 failed (${request.status}).`));
      }
    };
    request.onerror = () => {
      reject(new Error("Upload to Cloudflare R2 failed."));
    };
    request.onabort = () => {
      reject(new Error("Upload cancelled."));
    };
    request.send(file);
  });
}

type UploadConfig = {
  provider?: "local" | "r2" | "blob";
  uploadUrl?: string;
  publicUrl?: string;
  contentType?: string;
  error?: string;
};

async function prepareUpload(
  file: File,
  onProgress: (percent: number) => void
) {
  const configResponse = await fetch("/api/blob/upload", {
    cache: "no-store",
  });
  const config = (await configResponse.json()) as UploadConfig;

  if (!configResponse.ok) {
    throw new Error(config.error ?? "Could not prepare the upload.");
  }

  if (config.provider === "blob") {
    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/blob/upload",
      onUploadProgress: (progress) => {
        onProgress(Math.round(progress.percentage));
      },
    });
    return blob.url;
  }

  if (config.provider !== "r2") {
    throw new Error(
      config.error ??
        "Uploads are not configured. Add Cloudflare R2 storage or use a video link."
    );
  }

  const presignResponse = await fetch("/api/blob/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });
  const presign = (await presignResponse.json()) as UploadConfig;

  if (
    !presignResponse.ok ||
    !presign.uploadUrl ||
    !presign.publicUrl ||
    !presign.contentType
  ) {
    throw new Error(presign.error ?? "Could not prepare the upload.");
  }

  await uploadToR2(
    presign.uploadUrl,
    file,
    presign.contentType,
    onProgress
  );
  return presign.publicUrl;
}

function ChoiceChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-xs transition-colors",
        active
          ? "border-lime/45 bg-lime/10 text-lime"
          : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/80"
      )}
    >
      {children}
    </button>
  );
}

function CaptionColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 transition-colors hover:border-white/20">
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
        aria-label={`${label} color`}
      />
      <span className="text-[11px] text-white/55">{label}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/30">
        {value}
      </span>
    </label>
  );
}

export function NewClipDialog({
  open,
  onOpenChange,
  defaultTab = "upload",
  initialLink,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "upload" | "link";
  initialLink?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"upload" | "link">(defaultTab);
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState(initialLink ?? "");
  const [acknowledged, setAcknowledged] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [clipCount, setClipCount] = useState(10);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [background, setBackground] = useState<BackgroundMode>("crop");
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("bold");
  const [captionColors, setCaptionColors] = useState<CaptionColors>(
    DEFAULT_CAPTION_COLORS
  );
  const [language, setLanguage] = useState("en");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"idle" | "uploading" | "creating">("idle");
  const [uploadPercent, setUploadPercent] = useState(0);

  function acceptFile(nextFile: File | null) {
    if (!nextFile) {
      setFile(null);
      return;
    }
    if (!isVideoFile(nextFile)) {
      toast.error("Choose a video file (MP4, MOV, WebM, MKV, M4V or AVI).");
      return;
    }
    if (nextFile.size > MAX_UPLOAD_BYTES) {
      toast.error("That file is over 2 GB. Trim it or compress before uploading.");
      return;
    }
    setFile(nextFile);
  }

  const canSubmit =
    tab === "upload" ? Boolean(file) : Boolean(link.trim()) && acknowledged;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !canSubmit) return;

    setBusy(true);
    try {
      const options = {
        clipCount,
        aspectRatio,
        background,
        captionStyle,
        captionColors,
        language,
      };

      let body: Record<string, unknown>;

      if (tab === "upload" && file) {
        setPhase("uploading");
        setUploadPercent(0);

        const blobUrl = await prepareUpload(file, setUploadPercent);

        setPhase("creating");
        body = {
          sourceType: "upload",
          blobUrl,
          title: titleFromFilename(file.name) || "Uploaded video",
          sizeBytes: file.size,
          options,
        };
      } else {
        const trimmed = link.trim();
        try {
          const url = new URL(trimmed);
          if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error("protocol");
          }
        } catch {
          toast.error("Paste a valid public video link.");
          return;
        }

        setPhase("creating");
        body = {
          sourceType: "url",
          sourceUrl: trimmed,
          title: "Linked video",
          options,
        };
      }

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as {
        jobId?: string;
        error?: string;
        code?: string;
      };

      if (!response.ok) {
        toast.error(payload.error ?? "Could not queue the job.");
        return;
      }

      toast.success("Job queued. The worker will pick it up shortly.");
      onOpenChange(false);
      if (payload.jobId) {
        router.push(`/studio/jobs/${payload.jobId}`);
      }
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while queueing the job."
      );
    } finally {
      setBusy(false);
      setPhase("idle");
      setUploadPercent(0);
    }
  }

  const submitLabel =
    phase === "uploading"
      ? `Uploading ${uploadPercent}%`
      : phase === "creating"
        ? "Queueing job…"
        : `Create ${clipCount} clips`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border border-white/10 bg-[#0b0d0a] p-6 sm:max-w-2xl sm:p-7">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            New clip job
          </DialogTitle>
          <DialogDescription className="text-sm text-white/45">
            Upload a file or paste a public video link. Up to 2 hours of source
            per job.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-6">
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as "upload" | "link")}
            className="gap-4"
          >
            <TabsList className="w-full bg-white/[0.04]">
              <TabsTrigger value="upload" className="gap-1.5 py-1.5">
                <UploadCloud className="size-3.5" />
                Upload file
              </TabsTrigger>
              <TabsTrigger value="link" className="gap-1.5 py-1.5">
                <Link2 className="size-3.5" />
                Paste link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  acceptFile(event.dataTransfer.files?.[0] ?? null);
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition-colors",
                  dragging
                    ? "border-lime/50 bg-lime/[0.06]"
                    : "border-white/15 bg-white/[0.02]"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,.mkv"
                  className="sr-only"
                  onChange={(event) => {
                    acceptFile(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />

                {file ? (
                  <>
                    <span className="flex size-12 items-center justify-center rounded-xl border border-lime/25 bg-lime/[0.08] text-lime">
                      <FileVideo className="size-5" />
                    </span>
                    <p className="mt-4 max-w-full truncate font-display text-sm font-medium text-white/85">
                      {file.name}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                      {formatBytes(file.size)} · ready to upload
                    </p>
                    <button
                      type="button"
                      onClick={() => acceptFile(null)}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] text-white/40 transition-colors hover:text-white/80"
                    >
                      <X className="size-3" />
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-white/45">
                      <UploadCloud className="size-5" />
                    </span>
                    <p className="mt-4 font-display text-sm font-medium text-white/80">
                      Drop a video here, or choose a file
                    </p>
                    <p className="mt-1.5 text-xs text-white/35">
                      MP4, MOV, WebM or MKV · up to 2 GB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 h-9 border-white/15 bg-white/[0.03]"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse files
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="source-link" className="text-xs text-white/55">
                  Public video link
                </Label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                  <Input
                    id="source-link"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=…"
                    value={link}
                    onChange={(event) => setLink(event.target.value)}
                    className="h-10 border-white/12 bg-black/25 pl-9"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-[#c7ff3e]"
                />
                <span className="text-[11px] leading-relaxed text-white/45">
                  I own this video or have permission to repurpose it. I
                  understand downloading third-party content may violate the
                  platform&apos;s terms.
                </span>
              </label>
            </TabsContent>
          </Tabs>

          <div className="space-y-4 rounded-2xl border border-white/[0.07] bg-white/[0.015] p-4">
            <div className="flex items-center gap-2">
              <Wand2 className="size-3.5 text-lime/70" />
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
                Output settings
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[11px] text-white/45">Clips</Label>
                <div className="flex gap-1.5">
                  {[3, 5, 10].map((count) => (
                    <ChoiceChip
                      key={count}
                      active={clipCount === count}
                      onClick={() => setClipCount(count)}
                    >
                      {count}
                    </ChoiceChip>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] text-white/45">
                  Aspect ratio
                </Label>
                <div className="flex gap-1.5">
                  {(["9:16", "1:1", "16:9"] as const).map((ratio) => (
                    <ChoiceChip
                      key={ratio}
                      active={aspectRatio === ratio}
                      onClick={() => setAspectRatio(ratio)}
                    >
                      {ratio}
                    </ChoiceChip>
                  ))}
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[11px] text-white/45">Background</Label>
                <div className="flex flex-wrap gap-1.5">
                  {BACKGROUND_MODES.map((mode) => (
                    <ChoiceChip
                      key={mode}
                      active={background === mode}
                      onClick={() => setBackground(mode)}
                    >
                      {mode[0].toUpperCase() + mode.slice(1)}
                    </ChoiceChip>
                  ))}
                </div>
                <p className="text-[10px] leading-relaxed text-white/30">
                  {background === "random"
                    ? "Random mixes center crop and blurred fill across the clips."
                    : background === "blur"
                      ? "Fits the whole frame over a blurred fill of the same video."
                      : "Fills the frame with a center crop."}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] text-white/45">
                  Caption style
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {CAPTION_STYLES.map((style) => (
                    <ChoiceChip
                      key={style}
                      active={captionStyle === style}
                      onClick={() => setCaptionStyle(style)}
                    >
                      {style[0].toUpperCase() + style.slice(1)}
                    </ChoiceChip>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="caption-language"
                  className="text-[11px] text-white/45"
                >
                  Spoken language
                </Label>
                <select
                  id="caption-language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="h-[34px] w-full rounded-lg border border-white/10 bg-black/30 px-2.5 text-xs text-white/70 outline-none transition-colors focus:border-lime/40"
                >
                  {LANGUAGES.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-[#0b0d0a]"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[11px] text-white/45">
                  Caption colors
                </Label>
                <div className="flex flex-wrap gap-2">
                  <CaptionColorField
                    label="Text"
                    value={captionColors.text}
                    onChange={(text) =>
                      setCaptionColors((current) => ({ ...current, text }))
                    }
                  />
                  <CaptionColorField
                    label="Active word"
                    value={captionColors.highlight}
                    onChange={(highlight) =>
                      setCaptionColors((current) => ({ ...current, highlight }))
                    }
                  />
                </div>
                <p className="text-[10px] leading-relaxed text-white/30">
                  {captionStyle === "karaoke"
                    ? "Karaoke highlights each spoken word in the active-word color."
                    : "The active-word color is used by the Karaoke caption style."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-white/30">
              <Info className="mt-0.5 size-3 shrink-0" />
              Processing is unlimited. The worker downloads, transcribes,
              scores and renders while this page updates automatically.
            </p>
            <Button
              type="submit"
              disabled={!canSubmit || busy}
              className="h-11 w-full gap-2 bg-lime text-sm text-[#0b0f03] hover:bg-lime-soft"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
