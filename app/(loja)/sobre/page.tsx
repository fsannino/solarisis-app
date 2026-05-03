import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre — Solarisis",
  description:
    "A Solarisis nasce do desejo de viver o sol sem barreiras. Moda solar FPU 50+ pra quem mora no sol todo dia."
};

export default function SobrePage() {
  return (
    <main>
      {/* Manifesto */}
      <section className="mx-auto max-w-[1440px] px-4 pt-16 md:px-8 md:pt-24">
        <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:items-end md:gap-20">
          <div>
            <p className="eyebrow mb-6">Sobre · Manifesto</p>
            <h1 className="display text-[clamp(48px,7vw,104px)]">
              O sol é um{" "}
              <em className="not-italic italic text-orange">aliado</em>, não
              um risco.
            </h1>
          </div>
          <p className="max-w-[480px] text-[18px] leading-[1.6] text-ink-soft">
            A Solarisis nasce do desejo de viver o sol sem barreiras. Criamos
            peças que unem tecnologia e design pra que cada momento ao ar
            livre seja vivido com leveza, confiança e estilo. Mais do que
            vestir — é{" "}
            <em className="italic text-orange">sentir</em>.
          </p>
        </div>
      </section>

      {/* Foto + número */}
      <section className="mx-auto mt-20 max-w-[1440px] px-4 md:px-8">
        <div className="relative aspect-[16/9] overflow-hidden bg-sand">
          <Image
            src="/assets/photos/lifestyle-07.jpg"
            alt="Solarisis lifestyle"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-6">
          <p className="display text-[clamp(28px,3vw,42px)]">
            <em className="not-italic italic">Verão 26.</em>
          </p>
          <p className="eyebrow">N° 01 · Solarisis Moda Praia</p>
        </div>
      </section>

      {/* História */}
      <section className="mx-auto mt-24 max-w-[1440px] px-4 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:gap-20">
          <div>
            <p className="eyebrow mb-4">A história</p>
            <h2 className="display text-[clamp(36px,4.5vw,56px)]">
              De quem mora <em className="not-italic italic">no sol</em>,
              pra quem ama estar nele.
            </h2>
          </div>
          <div className="flex flex-col gap-5 text-[16px] leading-[1.7] text-ink-soft">
            <p>
              A Solarisis começa onde a maioria das marcas termina: no detalhe.
              Crescemos vendo que peças bonitas raramente protegiam, e peças
              que protegiam raramente eram bonitas. A escolha entre estilo e
              cuidado nunca fez sentido — e foi essa pergunta que virou marca.
            </p>
            <p>
              Cada coleção nasce de um trabalho conjunto entre estilistas,
              engenheiros têxteis e dermatologistas. Tecidos certificados FPU
              50+ que bloqueiam até 98% dos raios UV, modelagens que
              acompanham o corpo em movimento, fotografia que devolve o sol
              à pele.
            </p>
            <p>
              Vestimos quem trabalha de bermuda no escritório, quem leva os
              filhos pro mar antes do almoço, quem corre na areia, quem
              caminha. Vestimos a vida ao ar livre — sem que o ar livre cobre
              caro.
            </p>
          </div>
        </div>
      </section>

      {/* Valores em 3 colunas */}
      <section className="mx-auto mt-24 max-w-[1440px] px-4 md:px-8">
        <div className="grid border-y border-line md:grid-cols-3">
          {[
            {
              num: "01",
              title: "Função primeiro",
              body:
                "FPU 50+ certificado em todas as peças. Não é opcional — é o ponto de partida do design."
            },
            {
              num: "02",
              title: "Estética cotidiana",
              body:
                "Cortes, cores e estampas que funcionam na praia, no café e no fim de tarde. Sem fronteiras."
            },
            {
              num: "03",
              title: "Feito no Brasil",
              body:
                "Confecção no eixo Curitiba–São Paulo, parceiros locais, ciclo curto da fábrica até o seu armário."
            }
          ].map((v, i) => (
            <div
              key={v.num}
              className={`py-12 ${i > 0 ? "md:border-l md:border-line md:pl-10" : ""} ${i < 2 ? "md:pr-10" : ""}`}
            >
              <p className="eyebrow">{v.num}</p>
              <h3 className="mt-4 font-serif text-[28px] font-medium tracking-[-0.01em]">
                {v.title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-ink-soft">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-24 max-w-[1440px] px-4 pb-24 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-8 bg-ink p-12 text-bone md:p-16">
          <div className="max-w-[560px]">
            <p className="eyebrow mb-4 text-bone/55">Vem ver</p>
            <p className="display text-[clamp(32px,4vw,48px)] text-white">
              Mais do que vestir — é{" "}
              <em className="not-italic italic text-orange">sentir</em>.
            </p>
          </div>
          <Link
            href="/loja"
            className="inline-flex items-center gap-2.5 rounded-full bg-orange px-7 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-bone hover:text-ink"
          >
            Conhecer a coleção
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
