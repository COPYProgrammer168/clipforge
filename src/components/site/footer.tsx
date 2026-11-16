import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { footerColumns } from "@/lib/content";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/[0.07] bg-[#060706]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(50%_100%_at_50%_0%,rgba(199,255,62,0.07),transparent_70%)]" />
      <div className="site-container relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
              Turn long recordings into up to ten captioned clips. Open the
              studio, queue a job and download the exports.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55">
              <span className="relative flex size-2">
                <span className="relative inline-flex size-2 rounded-full bg-lime" />
              </span>
              No sign-up required
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="eyebrow mb-4">{column.title}</p>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/55 transition-colors hover:text-lime"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-white/[0.07] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/30">
            © 2026 ClipForge Labs · Made for people who publish
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/35">
            <Link href="/legal" className="transition-colors hover:text-white/70">
              Privacy
            </Link>
            <Link href="/legal" className="transition-colors hover:text-white/70">
              Terms
            </Link>
            <Link href="/legal" className="transition-colors hover:text-white/70">
              Content rights
            </Link>
            <span className="hidden h-3 w-px bg-white/10 sm:block" />
            <span>English</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden border-t border-white/[0.05]">
        <p
          aria-hidden="true"
          className="site-container select-none whitespace-nowrap pb-2 pt-6 font-display text-[clamp(64px,17vw,230px)] font-semibold leading-[0.78] tracking-[-0.06em] text-transparent [-webkit-text-stroke:1px_rgba(242,245,238,0.08)]"
        >
          ClipForge
        </p>
      </div>
    </footer>
  );
}
