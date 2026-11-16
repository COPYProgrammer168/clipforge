"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_PHRASES = [
  "up to ten clips",
  "vertical, square and wide cuts",
  "captioned highlights",
  "ready-to-post exports",
];

export function RotatingHeadline({
  phrases = DEFAULT_PHRASES,
}: {
  phrases?: string[];
}) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number | null>(null);
  const measureRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const measureWrap = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % phrases.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [phrases.length]);

  useEffect(() => {
    function update() {
      const node = measureRefs.current[index];
      if (node) setWidth(Math.ceil(node.getBoundingClientRect().width));
    }

    update();
    const observer = new ResizeObserver(update);
    if (measureWrap.current) observer.observe(measureWrap.current);
    window.addEventListener("resize", update);
    document.fonts?.ready.then(update).catch(() => undefined);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [index]);

  return (
    <h1 className="display mx-auto text-center text-[clamp(40px,7.2vw,86px)] leading-[0.96]">
      <span className="block text-white">Turn any footage into</span>
      <span className="relative mt-2 block sm:mt-3">
        <span
          ref={measureWrap}
          className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 opacity-0"
          aria-hidden="true"
        >
          {phrases.map((phrase, phraseIndex) => (
            <span
              key={phrase}
              ref={(node) => {
                measureRefs.current[phraseIndex] = node;
              }}
              className="block whitespace-nowrap px-5 font-display font-semibold tracking-[-0.035em] sm:px-7"
            >
              {phrase}
            </span>
          ))}
        </span>

        <span
          className="relative inline-flex h-[1.16em] items-center justify-center overflow-hidden rounded-full border border-lime/25 bg-[#0f1409] px-5 align-middle transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] sm:px-7"
          style={width ? { width: `${width + 6}px` } : undefined}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(80%_140%_at_20%_0%,rgba(199,255,62,0.22),transparent_55%),radial-gradient(70%_120%_at_90%_100%,rgba(199,255,62,0.12),transparent_60%)]"
          />
          <span
            aria-hidden="true"
            className="screen-line absolute inset-0 opacity-30"
          />
          <span
            key={index}
            className="relative whitespace-nowrap text-lime-soft animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {phrases[index]}
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1/3 animate-[scan_5s_linear_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          />
        </span>
      </span>
      <span className="mt-1 block text-white sm:mt-2">
        One<span className="text-lime">.</span> pass.
      </span>
    </h1>
  );
}
