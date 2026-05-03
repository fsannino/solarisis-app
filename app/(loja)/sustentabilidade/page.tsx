import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sustentabilidade — Solarisis",
  description:
    "Tecidos reciclados, ciclo curto, embalagens compostáveis. Os primeiros passos da Solarisis em direção a uma moda menos pesada."
};

const PILLARS = [
  {
    num: "01",
    title: "Tecidos com vida longa",
    body:
      "A peça que você compra hoje é a mesma daqui a 5 anos — proteção FPU 50+ que não sai na lavagem, modelagem que não desfia. Comprar menos e usar mais é o nosso primeiro princípio.",
    aspirational: false
  },
  {
    num: "02",
    title: "Reciclados em parte",
    body:
      "Boa parte das nossas peças já usa poliamida e poliéster reciclados (PA reciclada e rPET). Não estamos em 100% ainda — informamos a composição em cada produto.",
    aspirational: false
  },
  {
    num: "03",
    title: "Ciclo curto, made in BR",
    body:
      "Confecção no eixo Curitiba–São Paulo, parceiros pequenos, lotes menores. Menos voo, menos estoque parado, menos peça que sobra e queima.",
    aspirational: false
  },
  {
    num: "04",
    title: "Embalagem compostável",
    body:
      "Saquinhos de PLA (amido de milho) que se decompõem em 6 meses, etiquetas em papel certificado FSC. Em transição — algumas referências antigas ainda têm plástico convencional.",
    aspirational: true
  }
];

export default function SustentabilidadePage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-[1440px] px-4 pt-16 md:px-8 md:pt-24">
        <p className="eyebrow mb-6">Sustentabilidade · Jornada</p>
        <h1 className="display text-[clamp(48px,7vw,104px)]">
          Pensar{" "}
          <em className="not-italic italic text-orange">leve</em>,
          <br />
          cobrir bem.
        </h1>
        <p className="mt-8 max-w-[640px] text-[18px] leading-[1.6] text-ink-soft">
          A gente não acredita em sustentabilidade como rótulo. Acredita
          como prática diária — escolha por escolha, fornecedor por
          fornecedor. Esse é o ponto onde estamos, com o que já é real e o
          que ainda é meta.
        </p>
      </section>

      {/* Honestidade */}
      <section className="mx-auto mt-16 max-w-[1100px] px-4 md:px-8">
        <div className="border-l-4 border-orange bg-sand px-7 py-7">
          <p className="eyebrow mb-3 text-orange">Honestidade</p>
          <p className="text-[17px] leading-[1.7] text-ink">
            Esse é um trabalho em andamento. Em alguns pontos avançamos —
            tecido reciclado, lavagem com baixo consumo de água, parceiros
            locais. Em outros, ainda estamos longe — virgem é parte da
            mistura, embalagem está em transição. Em vez de prometer o que
            não fazemos, contamos onde estamos.
          </p>
        </div>
      </section>

      {/* Foto editorial */}
      <section className="mx-auto mt-20 max-w-[1440px] px-4 md:px-8">
        <div className="relative aspect-[16/9] overflow-hidden bg-sand">
          <Image
            src="/assets/photos/lifestyle-04.jpg"
            alt="Solarisis sustentabilidade"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* 4 pilares */}
      <section className="mx-auto mt-24 max-w-[1440px] px-4 md:px-8">
        <p className="eyebrow mb-3.5">Os pilares</p>
        <h2 className="display text-[clamp(36px,4.5vw,56px)]">
          O que <em className="not-italic italic">já é real</em>.
        </h2>
        <div className="mt-12 grid gap-x-12 gap-y-14 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.num}>
              <div className="flex items-center gap-3.5">
                <span className="display text-[32px] text-orange">{p.num}</span>
                {p.aspirational && (
                  <span className="rounded-full border border-line-strong px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    em transição
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-serif text-[28px] font-medium leading-tight tracking-[-0.01em]">
                {p.title}
              </h3>
              <p className="mt-3 max-w-[480px] text-[15px] leading-[1.65] text-ink-soft">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* O que ainda falta */}
      <section className="mx-auto mt-24 max-w-[1100px] px-4 md:px-8">
        <p className="eyebrow mb-3.5">Próximos passos</p>
        <h2 className="display text-[clamp(36px,4.5vw,56px)]">
          O que <em className="not-italic italic">ainda falta</em>.
        </h2>
        <ul className="mt-10 flex flex-col divide-y divide-line border-y border-line text-[16px]">
          {[
            "Atingir 80% de fibra reciclada em todas as linhas até 2027.",
            "Substituir 100% das embalagens por compostável certificada até o fim de 2026.",
            "Programa de reaproveitamento — devolver peça usada em troca de cupom.",
            "Relatório público anual com pegada de carbono e consumo de água."
          ].map((goal) => (
            <li key={goal} className="flex items-start gap-4 py-5">
              <span
                aria-hidden
                className="mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink-faint"
              >
                <span className="h-2 w-2 rounded-full bg-line-strong" />
              </span>
              <span className="text-ink">{goal}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-24 max-w-[1440px] px-4 pb-24 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-8 bg-ink p-12 text-bone md:p-16">
          <div className="max-w-[560px]">
            <p className="eyebrow mb-4 text-bone/55">Caminhe com a gente</p>
            <p className="display text-[clamp(32px,4vw,48px)] text-white">
              Comprar menos —
              <br />
              <em className="not-italic italic text-orange">e melhor</em>.
            </p>
          </div>
          <Link
            href="/loja"
            className="inline-flex items-center gap-2.5 rounded-full bg-orange px-7 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-bone hover:text-ink"
          >
            Ver peças disponíveis
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
