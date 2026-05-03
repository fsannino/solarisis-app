import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre — Solarisis",
  description:
    "A Solarisis nasce do desejo de viver o sol sem barreiras. Tecnologia, conforto e design pra cada momento ao ar livre."
};

export default function SobrePage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-[1440px] px-4 pt-20 md:px-8">
        <p className="eyebrow mb-6">Sobre · Solarisis</p>
        <h1 className="display max-w-[1200px] text-[clamp(56px,9vw,140px)]">
          O sol como{" "}
          <em className="not-italic italic text-orange">aliado.</em>
        </h1>
        <p className="mt-9 max-w-[720px] font-serif text-[clamp(20px,2vw,22px)] font-light leading-[1.45] text-ink-soft">
          A Solarisis nasce do desejo de viver o sol sem barreiras. Unimos
          tecnologia, conforto e design para que cada momento ao ar livre
          seja vivido com leveza, confiança e estilo.
        </p>
      </section>

      {/* Foto editorial 21:9 */}
      <section className="mx-auto mt-20 max-w-[1440px] px-4 md:px-8">
        <div className="relative aspect-[21/9] overflow-hidden bg-sand">
          <Image
            src="/assets/photos/lifestyle-07.jpg"
            alt="Solarisis editorial"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Manifesto duas colunas */}
      <section className="mx-auto max-w-[1440px] px-4 pt-30 md:px-8">
        <div className="grid gap-12 md:grid-cols-2 md:gap-20">
          <div>
            <p className="eyebrow mb-3.5">Manifesto</p>
            <h2 className="display text-[clamp(36px,4.5vw,56px)]">
              Liberdade ao sol,{" "}
              <em className="not-italic italic">sem rótulos.</em>
            </h2>
          </div>
          <div className="text-[16px] leading-[1.65] text-ink-soft">
            <p>
              Acreditamos que o sol deve ser um aliado, não um risco. Que a
              proteção pode ser elegante. Que todas as pessoas merecem se
              sentir confortáveis e confiantes sob a luz natural.
            </p>
            <p className="mt-5">
              Por isso desenhamos peças tecnológicas com olhar de moda — para
              a praia, a piscina e o lifestyle urbano. Para todas as idades,
              todos os corpos, todas as horas do dia.
            </p>
            <p className="mt-5">Mais sol. Menos preocupação.</p>
          </div>
        </div>
      </section>

      {/* 3 pilares */}
      <section className="mx-auto max-w-[1440px] px-4 pt-30 md:px-8">
        <div className="grid border-y border-line md:grid-cols-3">
          {[
            {
              num: "01",
              title: "Liberdade ao sol",
              body: "A proposta não é limitar — é libertar."
            },
            {
              num: "02",
              title: "Autocuidado inteligente",
              body: "Tecnologia têxtil em peças desejáveis."
            },
            {
              num: "03",
              title: "Moda funcional com identidade",
              body: "Estilo que acompanha sua vida."
            }
          ].map((p, i) => (
            <div
              key={p.num}
              className={`py-12 ${i > 0 ? "md:border-l md:border-line md:pl-8" : ""} ${i < 2 ? "md:pr-8" : ""}`}
            >
              <p className="eyebrow mb-4">{p.num} · Pilar</p>
              <h3 className="font-serif text-[30px] font-medium tracking-[-0.01em]">
                {p.title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-ink-soft">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 2 fotos lado a lado */}
      <section className="mx-auto max-w-[1440px] px-4 pb-24 pt-30 md:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden bg-sand">
            <Image
              src="/assets/photos/lifestyle-06.jpg"
              alt="Detalhe tecido"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-sand">
            <Image
              src="/assets/photos/lifestyle-02.jpg"
              alt="Atelier"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
