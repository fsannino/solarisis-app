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
        <button
          type="button"
          className="inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-bone hover:text-ink"
        >
          Quero entrar
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
