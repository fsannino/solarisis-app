import { TESTIMONIALS } from "@/lib/home-content";

export function Testimonials() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-30 md:px-8">
      <div className="grid gap-8 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <figure
            key={i}
            className="border border-line bg-sand p-8 md:p-9"
          >
            <span className="block font-serif text-[36px] leading-none text-orange">
              “
            </span>
            <blockquote className="mt-2 font-serif text-[22px] leading-[1.35] tracking-[-0.01em] text-ink">
              {t.quote}
            </blockquote>
            <figcaption className="eyebrow mt-6">{t.who}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
