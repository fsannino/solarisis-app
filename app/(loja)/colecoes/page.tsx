import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coleções — Solarisis",
  description:
    "Solar Flow, Brisa UV, Raiz Mini — três narrativas de sol pra Verão 26."
};

const COLLECTIONS = [
  {
    slug: "solar-flow",
    season: "Verão 26",
    no: "01",
    name: "Solar Flow",
    desc: "Cortes fluidos e estampas vibrantes para dias longos de sol.",
    image: "/assets/photos/lifestyle-04.jpg"
  },
  {
    slug: "brisa-uv",
    season: "Resort",
    no: "02",
    name: "Brisa UV",
    desc: "Tecidos respiráveis com FPU 50+ para movimentos livres do mergulho ao café da tarde.",
    image: "/assets/photos/lifestyle-07.jpg"
  },
  {
    slug: "raiz-mini",
    season: "Infantil",
    no: "03",
    name: "Raiz Mini",
    desc: "A mesma proteção, em peças que crescem com eles.",
    image: "/assets/photos/produto-1.jpg"
  }
];

export default function ColecoesPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-4 pt-20 pb-24 md:px-8">
      <p className="eyebrow mb-4">Coleções · Verão 26</p>
      <h1 className="display text-[clamp(48px,8vw,88px)]">
        Três <em className="not-italic italic">narrativas</em> de sol.
      </h1>

      <div className="mt-16 flex flex-col gap-24">
        {COLLECTIONS.map((c, i) => {
          const reversed = i % 2 === 1;
          const ctaHref =
            c.slug === "raiz-mini"
              ? "/loja?linha=mini"
              : `/loja?colecao=${c.slug}`;
          return (
            <article
              key={c.slug}
              className="grid items-center gap-12 md:grid-cols-2 md:gap-12"
            >
              <div className={reversed ? "md:order-2" : ""}>
                <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className={reversed ? "md:order-1" : ""}>
                <p className="eyebrow mb-3.5">
                  {c.season} · Nº {c.no}
                </p>
                <h2 className="display text-[clamp(48px,6vw,72px)]">
                  {c.name}.
                </h2>
                <p className="mt-6 max-w-[480px] text-[18px] leading-[1.55] text-ink-soft">
                  {c.desc}
                </p>
                <Link
                  href={ctaHref}
                  className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
                >
                  Ver peças
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
