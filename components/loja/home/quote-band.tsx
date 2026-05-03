import Link from "next/link";

export function QuoteBand() {
  return (
    <section className="mt-30 bg-ink py-30 text-bone">
      <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-4 md:grid-cols-[1fr_1.2fr] md:gap-20 md:px-8">
        <div>
          <p className="eyebrow mb-5 text-bone/55">Manifesto</p>
          <p className="display text-[clamp(40px,5.5vw,64px)] text-white">
            O sol é um <em className="not-italic italic text-orange">aliado</em>
            , não um risco.
          </p>
        </div>
        <div>
          <p className="max-w-[540px] text-[18px] leading-[1.6] text-bone/85">
            A Solarisis nasce do desejo de viver o sol sem barreiras. Criamos
            peças que unem tecnologia e design para que cada momento ao ar
            livre seja vivido com leveza, confiança e estilo.
          </p>
          <p className="mt-5 max-w-[540px] text-[18px] leading-[1.6] text-bone/85">
            Mais do que vestir — é{" "}
            <em className="italic text-orange">sentir</em>.
          </p>
          <Link
            href="/sobre"
            className="mt-9 inline-flex items-center gap-2.5 rounded-full bg-orange px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-bone hover:text-ink"
          >
            Sobre a marca
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
