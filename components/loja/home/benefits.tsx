import { BENEFITS } from "@/lib/home-content";

const BG_BY_ACCENT = {
  orange: "bg-orange",
  green: "bg-green",
  ink: "bg-ink"
} as const;

export function Benefits() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-30 md:px-8">
      <div className="grid items-start gap-12 md:grid-cols-[1fr_2fr] md:gap-20">
        <div>
          <p className="eyebrow mb-4">Por dentro do tecido</p>
          <h2 className="display text-[clamp(36px,4.5vw,56px)]">
            Proteção que <em className="not-italic italic">se sente</em>,
            design que <em className="not-italic italic">se vê</em>.
          </h2>
        </div>
        <p className="pt-3 text-[17px] leading-[1.6] text-ink-soft">
          Cada peça Solarisis nasce de tecidos tecnológicos pensados para o
          sol brasileiro. Conforto térmico, secagem rápida, durabilidade
          frente ao sal e cloro — sem perder o caimento.
        </p>
      </div>

      <div className="mt-12 grid border-t border-line md:grid-cols-3">
        {BENEFITS.map((b, i) => (
          <div
            key={b.num}
            className={`py-10 ${i > 0 ? "md:border-l md:border-line md:pl-8" : ""} ${i < BENEFITS.length - 1 ? "md:pr-8" : ""}`}
          >
            <div className="mb-6 flex items-center gap-3.5">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full text-white ${BG_BY_ACCENT[b.accent]}`}
              >
                <BenefitIcon name={b.icon} />
              </div>
              <span className="eyebrow">{b.num}</span>
            </div>
            <h3 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-ink">
              {b.title}
            </h3>
            <p className="mt-3 text-[15px] leading-[1.55] text-ink-soft">
              {b.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BenefitIcon({ name }: { name: "sun" | "leaf" | "drop" }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  if (name === "sun")
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
      </svg>
    );
  if (name === "leaf")
    return (
      <svg {...props}>
        <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14z" />
        <path d="M5 19c2-4 5-7 9-9" />
      </svg>
    );
  return (
    <svg {...props}>
      <path d="M12 3s6 7 6 12a6 6 0 01-12 0c0-5 6-12 6-12z" />
    </svg>
  );
}
