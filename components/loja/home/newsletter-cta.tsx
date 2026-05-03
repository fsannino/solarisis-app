import { NewsletterCtaButton } from "./newsletter-cta-button";

export function NewsletterCta() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-30 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-12 bg-orange p-10 text-white md:p-20">
        <div className="max-w-[480px] flex-1 basis-[400px]">
          <p className="eyebrow mb-3.5 text-white/85">· Newsletter</p>
          <h2 className="display text-[clamp(36px,5vw,56px)] text-white">
            Mais sol. <em className="not-italic italic">Menos preocupação.</em>
          </h2>
          <p className="mt-4 max-w-[480px] text-[17px] text-white/90">
            10% off na primeira compra ao entrar na nossa lista — e
            prioridade nos lançamentos.
          </p>
        </div>
        <NewsletterCtaButton />
      </div>
    </section>
  );
}
