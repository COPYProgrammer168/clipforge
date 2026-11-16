import { cn } from "@/lib/utils";

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  align = "left",
  className,
  action,
}: {
  index?: string;
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        action && "lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
        {(index || eyebrow) && (
          <div
            className={cn(
              "mb-5 flex items-center gap-3",
              align === "center" && "justify-center"
            )}
          >
            {index ? (
              <span className="font-mono text-[11px] tabular-nums text-white/25">
                [{index}]
              </span>
            ) : null}
            {eyebrow ? <span className="eyebrow-lime">{eyebrow}</span> : null}
            <span className="h-px w-8 bg-white/10" aria-hidden="true" />
          </div>
        )}
        <h2 className="display text-[clamp(34px,5.4vw,64px)] leading-[0.98]">
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-6 max-w-2xl text-[15px] leading-relaxed text-white/50 sm:text-base",
              align === "center" && "mx-auto"
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
