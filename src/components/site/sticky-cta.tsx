"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function StickyCta() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 900);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 transition-all duration-300",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <div className="glass flex items-center gap-3 rounded-full border border-white/12 py-1.5 pl-4 pr-1.5 shadow-2xl">
        <span className="hidden text-xs text-white/55 sm:block">
          Unlimited clips. No account.
        </span>
        <Link
          href="/studio"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lime px-4 text-xs font-semibold text-lime-ink"
        >
          Open studio
          <ArrowRight className="size-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="inline-flex size-7 items-center justify-center rounded-full text-white/35 transition-colors hover:text-white/70"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
