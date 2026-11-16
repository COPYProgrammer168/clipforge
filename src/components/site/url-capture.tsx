"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export function UrlCapture({
  variant = "hero",
  className,
  autoFocus = false,
}: {
  variant?: "hero" | "band";
  className?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = value.trim();

    if (!url) {
      setError("Paste a video link or upload a file to get started.");
      return;
    }

    if (!/^https?:\/\/\S+\.\S+/i.test(url)) {
      setError("That does not look like a valid link. Try a full https:// URL.");
      return;
    }

    setError("");
    router.push(`/studio?link=${encodeURIComponent(url)}`);
  }

  return (
    <div className={cn("w-full", className)}>
      <form
        onSubmit={submit}
        className={cn(
          "group flex w-full flex-col gap-2 rounded-2xl border border-white/12 bg-[#111310]/85 p-2 backdrop-blur transition-colors focus-within:border-lime/50 sm:flex-row sm:items-center sm:rounded-full",
          variant === "band" && "sm:p-2.5"
        )}
      >
        <label className="flex min-w-0 flex-1 items-center gap-2.5 px-3 sm:px-2">
          <Link2 className="size-4 shrink-0 text-white/35" />
          <span className="sr-only">Video link</span>
          <input
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError("");
            }}
            autoFocus={autoFocus}
            placeholder="Drop a video link or paste a URL"
            className="h-11 w-full min-w-0 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
            type="url"
            inputMode="url"
          />
        </label>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className={cn(
              "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-lime-ink transition-transform hover:-translate-y-0.5 sm:flex-none",
              variant === "band" && "sm:h-12 sm:px-6"
            )}
          >
            Queue this link
            <ArrowRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => router.push("/studio?upload=1")}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white sm:flex-none"
          >
            <Upload className="size-4" />
            Upload
          </button>
        </div>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[11px] text-white/35">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-lime/70" />
          Unlimited processing · no account
        </span>
        <span>MP4, MOV, WebM, MKV</span>
        <span className="hidden sm:inline">2 GB upload limit</span>
      </div>
      {error ? (
        <p role="alert" className="mt-2 px-1 text-xs text-[#ff8b80]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
