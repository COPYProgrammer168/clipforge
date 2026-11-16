import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/content";

export function Faq({ limit }: { limit?: number }) {
  const items = typeof limit === "number" ? faqs.slice(0, limit) : faqs;

  return (
    <Accordion
      multiple={false}
      defaultValue={["faq-0"]}
      className="w-full border-t border-white/[0.08]"
    >
      {items.map((item, index) => (
        <AccordionItem
          key={item.q}
          value={`faq-${index}`}
          className="border-b border-white/[0.08]"
        >
          <AccordionTrigger className="gap-6 py-5 text-left font-display text-[clamp(16px,1.8vw,20px)] font-medium tracking-[-0.01em] text-white/85 transition-colors hover:text-white hover:no-underline sm:py-6 [&_[data-slot=accordion-trigger-icon]]:size-5 [&_[data-slot=accordion-trigger-icon]]:text-lime">
            <span className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] tabular-nums text-white/25">
                0{index + 1}
              </span>
              {item.q}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-6 text-[14px] leading-relaxed text-white/50">
            <p className="max-w-3xl pl-8">{item.a}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
