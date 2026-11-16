import Link from "next/link";
import { Infinity as InfinityIcon } from "lucide-react";
import { Logo } from "@/components/site/logo";

export const dynamic = "force-dynamic";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-7">
            <Logo href="/studio" />
            <nav className="hidden items-center gap-5 text-sm sm:flex">
              <Link
                href="/studio"
                className="text-white/70 transition-colors hover:text-white"
              >
                Studio
              </Link>
              <Link
                href="/pricing"
                className="text-white/45 transition-colors hover:text-white"
              >
                Access
              </Link>
              <Link
                href="/"
                className="text-white/45 transition-colors hover:text-white"
              >
                Website
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-lime/20 bg-lime/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-lime/80 sm:inline-flex">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-lime" />
              Beta
            </span>
            <div className="flex items-center gap-2.5 border-l border-white/10 pl-3">
              <span className="flex size-8 items-center justify-center rounded-full border border-lime/20 bg-lime/10 text-lime">
                <InfinityIcon className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-medium text-white/80">Unlimited</p>
                <p className="hidden text-[10px] text-white/35 sm:block">
                  No account needed
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="mx-auto flex h-10 w-full max-w-[1320px] items-center gap-5 border-t border-white/[0.05] px-5 text-xs sm:hidden">
          <Link href="/studio" className="text-white/70">
            Studio
          </Link>
          <Link href="/pricing" className="text-white/45">
            Access
          </Link>
          <Link href="/" className="text-white/45">
            Website
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1320px] px-5 py-8 sm:px-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
