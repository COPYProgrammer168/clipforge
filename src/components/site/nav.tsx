"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Sparkles, X } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

const productLinks = [
  { label: "Clipping engine", href: "/smart-clips", description: "Sentence-aligned clips" },
  { label: "Aspect ratios", href: "/smart-reframe", description: "9:16, 1:1 and 16:9" },
  { label: "Captions", href: "/captions", description: "Burned in plus SRT" },
];

const primaryLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Workspace", href: "/team-workspace" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <div className="relative z-40 border-b border-white/[0.06] bg-black/60">
        <div className="site-container flex h-10 items-center justify-center gap-2 text-center text-[12px] text-white/70">
          <span className="hidden size-1.5 rounded-full bg-lime sm:block" />
          <span className="truncate">
            ClipForge is in beta: unlimited processing, no account and 1080p
            exports.
          </span>
          <Link
            href="/pricing"
            className="hidden shrink-0 items-center gap-1 font-medium text-lime transition-opacity hover:opacity-80 sm:inline-flex"
          >
            Access details
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
        <div className="glass mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between gap-4 rounded-2xl border border-white/[0.08] px-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] sm:px-5">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            <div className="group relative">
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm text-white/65 transition-colors hover:text-white",
                  productLinks.some((l) => isActive(l.href)) && "text-white"
                )}
                aria-haspopup="true"
              >
                Product
                <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />
              </button>
              <div className="pointer-events-none absolute left-0 top-full w-[320px] translate-y-1 pt-3 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="rounded-2xl border border-white/10 bg-[#0d0f0c]/95 p-2 shadow-2xl backdrop-blur-xl">
                  {productLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
                    >
                      <span className="text-sm font-medium text-white">
                        {link.label}
                      </span>
                      <span className="text-xs text-white/45">{link.description}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm text-white/65 transition-colors hover:text-white",
                  isActive(link.href) && "text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-lime/20 bg-lime/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-lime/80 sm:inline-flex">
              Unlimited
            </span>
            <Link
              href="/studio"
              className="group inline-flex h-10 items-center gap-2 rounded-full bg-lime px-4 text-sm font-semibold text-lime-ink transition-transform hover:-translate-y-0.5"
            >
              <Sparkles className="size-4 transition-transform group-hover:rotate-12" />
              Open studio
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 text-white/80 transition-colors hover:text-white lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[90] flex flex-col bg-[#08090a] lg:hidden">
          <div className="site-container flex h-20 items-center justify-between">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 text-white/80"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="site-container flex-1 overflow-y-auto pb-10">
            <p className="eyebrow mb-4">Product</p>
            <div className="flex flex-col gap-1">
              {productLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between border-b border-white/[0.07] py-4 font-display text-2xl tracking-[-0.03em]"
                >
                  {link.label}
                  <span className="font-mono text-xs text-white/30">↗</span>
                </Link>
              ))}
            </div>
            <p className="eyebrow mb-4 mt-10">More</p>
            <div className="flex flex-col gap-1">
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between border-b border-white/[0.07] py-4 font-display text-2xl tracking-[-0.03em]"
                >
                  {link.label}
                  <span className="font-mono text-xs text-white/30">↗</span>
                </Link>
              ))}
            </div>
            <Link
              href="/studio"
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-lime text-sm font-semibold text-lime-ink"
            >
              Open studio — unlimited
            </Link>
            <p className="mt-4 text-center text-xs text-white/40">
              No account, no card, no processing cap.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
