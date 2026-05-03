import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tecnologia FPU 50+ — Solarisis",
  description:
    "Como funciona o tecido com proteção FPU 50+: o que mede, o que bloqueia, durabilidade após lavagens e os padrões internacionais."
};

const FACTS = [
  {
    label: "98%",
    title: "dos raios UVA + UVB bloqueados",
    body:
      "FPU 50+ é o índice máximo de bloqueio reconhecido. Significa que apenas 1/50 dos raios ultravioleta atravessam o tecido — o resto é refletido ou absorvido pela trama."
  },
  {
    label: "AS/NZS 4399",
    title: "padrão internacional",
    body:
      "O Fator de Proteção Ultravioleta (FPU/UPF) é o equivalente ao FPS dos cosméticos, mas medido em tecidos. Seguimos a norma australiana/neozelandesa, referência global em moda solar."
  },
  {
    label: "+50 lavagens",
    title: "proteção que não desbota",
    body:
      "Diferente de tecido tratado por aplicação química, nossa proteção vem da estrutura da fibra. Continua igual depois de muita lavagem, sal, cloro e sol."
  }
];

export default function TecnologiaPage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-[1440px] px-4 pt-16 md:px-8 md:pt-24">
        <p className="eyebrow mb-6">Tecnologia · FPU 50+</p>
        <h1 className="display text-[clamp(48px,7vw,104px)]">
          Não é{" "}
          <em className="not-italic italic text-orange">tratamento</em>.
          <br />É <em className="not-italic italic text-orange">tecido</em>.
        </h1>
        <p className="mt-8 max-w-[640px] text-[18px] leading-[1.6] text-ink-soft">
          A diferença entre uma camiseta comum e uma peça Solarisis está em
          como o fio é construído — não em algo passado por cima. Por isso a
          proteção dura toda a vida útil da peça, sem perder força a cada
          lavagem.
        </p>
      </section>

      {/* 3 fatos */}
      <section className="mx-auto mt-20 max-w-[1440px] px-4 md:px-8">
        <div className="grid border-y border-line md:grid-cols-3">
          {FACTS.map((f, i) => (
            <div
              key={f.label}
              className={`py-14 ${i > 0 ? "md:border-l md:border-line md:pl-10" : ""} ${i < 2 ? "md:pr-10" : ""}`}
            >
              <p className="display text-[clamp(48px,5vw,72px)] text-orange">
                {f.label}
              </p>
              <h3 className="mt-4 font-serif text-[22px] font-medium leading-tight tracking-[-0.01em]">
                {f.title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-ink-soft">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Composição típica */}
      <section className="mx-auto mt-24 max-w-[1440px] px-4 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1.1fr_1fr] md:gap-20">
          <div className="relative aspect-[4/5] overflow-hidden bg-sand">
            <Image
              src="/assets/photos/lifestyle-06.jpg"
              alt="Tecido Solarisis em detalhe"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow mb-4">A trama</p>
            <h2 className="display text-[clamp(32px,4vw,48px)]">
              Poliamida + elastano,{" "}
              <em className="not-italic italic">no balanço certo</em>.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-ink-soft">
              A maioria das peças usa a combinação{" "}
              <strong className="text-ink">80% poliamida e 20% elastano</strong>.
              A poliamida dá resistência ao cloro e ao sal e desliza no corpo;
              o elastano oferece o caimento que volta ao formato depois de
              esticar. Juntos, são leves o suficiente pra secar em minutos e
              firmes o bastante pra não marcar.
            </p>
            <p className="mt-4 text-[16px] leading-[1.7] text-ink-soft">
              Em peças mais cobertas (camisetas e macacões UV), aumentamos a
              gramatura pra dar mais opacidade e durabilidade — sem perder a
              respirabilidade.
            </p>
            <ul className="mt-8 grid gap-3 text-[14px]">
              {[
                "Secagem rápida — voltar do mar não é problema",
                "Resistente ao cloro e ao sal",
                "Não amassa, não desfia, não desbota",
                "Caimento que se ajusta sem apertar"
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-soft text-orange"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </span>
                  <span className="text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ rápida */}
      <section className="mx-auto mt-24 max-w-[1100px] px-4 md:px-8">
        <p className="eyebrow mb-3.5">Perguntas comuns</p>
        <h2 className="display text-[clamp(32px,4vw,48px)]">
          O que é{" "}
          <em className="not-italic italic">bom saber</em>.
        </h2>
        <div className="mt-10 flex flex-col divide-y divide-line border-y border-line">
          {[
            {
              q: "FPU é a mesma coisa que FPS?",
              a: "Não. FPS é uma medida pra protetores solares (cremes); FPU/UPF é o equivalente pra tecidos. Os dois bloqueiam UV, mas com métodos de medição diferentes. FPU 50+ é o nível máximo certificado."
            },
            {
              q: "Posso lavar à máquina?",
              a: "Sim. Ciclo delicado, água fria, sem alvejante. Como a proteção está na fibra, ela aguenta lavagens de rotina sem perder força. Evite secadora pra preservar o caimento."
            },
            {
              q: "Posso usar embaixo da água?",
              a: "Pode. Todas as peças aguentam mar, piscina e cloro. O caimento foi pensado pra não enrolar quando você mergulha — especialmente nas mangas longas e macacões."
            },
            {
              q: "Tem pra criança?",
              a: "Tem. A linha Raiz Mini tem o mesmo FPU 50+, com modelagens pensadas pra brincadeira: zíperes que travam, costuras que não incomodam, cores que ficam vivas."
            }
          ].map((qa) => (
            <details
              key={qa.q}
              className="group py-6 [&[open]>summary>span:last-child]:rotate-45"
            >
              <summary className="flex cursor-pointer items-start justify-between gap-4 list-none">
                <span className="font-serif text-[20px] font-medium leading-snug">
                  {qa.q}
                </span>
                <span
                  aria-hidden
                  className="mt-1.5 inline-flex h-6 w-6 shrink-0 items-center justify-center text-ink-soft transition-transform"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 max-w-[760px] text-[15px] leading-[1.65] text-ink-soft">
                {qa.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-24 max-w-[1440px] px-4 pb-24 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-8 bg-orange-soft p-12 md:p-16">
          <div className="max-w-[560px]">
            <p className="eyebrow mb-3 text-orange">Pronto pra sentir?</p>
            <p className="display text-[clamp(32px,4vw,48px)] text-ink">
              Cobertura{" "}
              <em className="not-italic italic text-orange">leve</em>, sol o
              dia inteiro.
            </p>
          </div>
          <Link
            href="/loja"
            className="inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-4 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
          >
            Ver coleção
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
