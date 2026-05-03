import Link from "next/link";
import Image from "next/image";
import { HERO_IMAGE } from "@/lib/home-content";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="mx-auto max-w-[1440px] px-4 pt-10 md:px-8 md:pt-16">
        <div className="grid items-end gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
          <div>
            <p className="eyebrow mb-7">· Verão 26 · Coleção Solar Flow</p>
            <h1 className="display text-[clamp(54px,8.4vw,132px)]">
              Seu sol,
              <br />
              <em className="not-italic italic text-orange">seu jeito.</em>
            </h1>
            <p className="mt-8 max-w-[460px] text-[17px] leading-[1.55] text-ink-soft">
              Moda praia com proteção FPU 50+ — para quem quer aproveitar
              cada raio sem medo, do mergulho ao café da tarde.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/loja"
                className="inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
              >
                Explorar coleção
                <ArrowRight />
              </Link>
              <Link
                href="/sobre"
                className="inline-flex items-center gap-2.5 rounded-full border border-line-strong px-6 py-3.5 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-bone"
              >
                Conheça a marca
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden bg-sand">
              <Image
                src={HERO_IMAGE}
                alt="Solarisis Verão 26"
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 max-w-[240px] border border-line bg-bone p-4 md:-bottom-7 md:-left-7 md:p-5">
              <p className="eyebrow text-[10px]">FPU 50+ certificado</p>
              <p className="mt-1 font-serif text-[19px] font-medium leading-[1.2]">
                Bloqueia 98% dos raios UV — testado e aprovado.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20 flex items-center justify-between border-b border-line pb-7">
          <span className="eyebrow">Role para descobrir</span>
          <span className="eyebrow">N° 01 · Solarisis</span>
        </div>
      </div>
    </section>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
