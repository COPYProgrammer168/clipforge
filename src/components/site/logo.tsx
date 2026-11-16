import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <path
        d="M4 7.5h8M4 7.5v8M28 24.5h-8M28 24.5v-8"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M12.8 11.4 21 16l-8.2 4.6v-9.2Z" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  href = "/",
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  href?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-85",
        className
      )}
      aria-label="ClipForge home"
    >
      <LogoMark className={cn("text-lime", markClassName)} />
      {showWordmark ? (
        <span className="font-display text-[1.15rem] font-semibold tracking-[-0.04em]">
          ClipForge
        </span>
      ) : null}
    </Link>
  );
}
