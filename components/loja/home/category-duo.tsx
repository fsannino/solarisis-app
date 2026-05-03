import Link from "next/link";
import Image from "next/image";
import { CATEGORY_IMAGES } from "@/lib/home-content";

const CATEGORIES = [
  {
    href: "/loja?categoria=ADULTO",
    label: "Adulto",
    title: "Liberdade ao sol.",
    img: CATEGORY_IMAGES.adult
  },
  {
    href: "/loja?categoria=INFANTIL",
    label: "Mini",
    title: "Brincadeira segura.",
    img: CATEGORY_IMAGES.kids
  }
];

export function CategoryDuo() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-30 md:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3.5">Família Solarisis</p>
          <h2 className="display text-[clamp(36px,4.5vw,56px)]">
            Para quem cresce <em className="not-italic italic">e</em> para
            quem está crescendo.
          </h2>
        </div>
        <Link
          href="/loja"
          className="hidden whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:text-orange md:inline-flex md:items-center md:gap-1.5"
        >
          Ver tudo <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group relative aspect-[3/4] overflow-hidden"
          >
            <Image
              src={c.img}
              alt={c.label}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/15 via-transparent to-ink/60" />
            <div className="absolute inset-0 flex flex-col justify-between p-8 text-bone md:p-10">
              <span className="eyebrow text-bone/85">· {c.label}</span>
              <div>
                <h3 className="display text-[clamp(40px,5vw,56px)] text-white">
                  {c.title}
                </h3>
                <p className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-white">
                  Comprar {c.label.toLowerCase()}{" "}
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
