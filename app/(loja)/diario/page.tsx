import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diário — Solarisis",
  description:
    "Notas de sol — editorial, dicas de cuidado, viagens e bastidores Solarisis."
};

const POSTS = [
  {
    tag: "Cuidados",
    title: "Como o tecido FPU 50+ funciona — e por que dura.",
    read: "5 min",
    image: "/assets/photos/lifestyle-05.jpg"
  },
  {
    tag: "Lifestyle",
    title: "5 lugares para viver o sol em fevereiro de 2026.",
    read: "7 min",
    image: "/assets/photos/lifestyle-01.jpg"
  },
  {
    tag: "Moda",
    title: "Macacões UV: do mergulho ao café da tarde.",
    read: "4 min",
    image: "/assets/photos/produto-1.jpg"
  },
  {
    tag: "Família",
    title: "Crianças no sol: liberdade, sem queimar.",
    read: "6 min",
    image: "/assets/photos/produto-3.jpg"
  }
];

export default function DiarioPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-4 pt-20 pb-24 md:px-8">
      <p className="eyebrow mb-4">Diário Solarisis</p>
      <h1 className="display text-[clamp(48px,8vw,88px)]">
        Notas <em className="not-italic italic">de sol.</em>
      </h1>

      <div className="mt-16 grid gap-7 md:grid-cols-2">
        {POSTS.map((p) => (
          <article key={p.title} className="cursor-pointer">
            <div className="relative aspect-[3/2] overflow-hidden bg-sand">
              <Image
                src={p.image}
                alt={p.tag}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out hover:scale-[1.02]"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="eyebrow">{p.tag}</span>
              <span className="eyebrow text-ink-soft">{p.read}</span>
            </div>
            <h3 className="mt-2.5 font-serif text-[clamp(24px,2.5vw,30px)] font-medium leading-[1.15] tracking-[-0.01em]">
              {p.title}
            </h3>
          </article>
        ))}
      </div>
    </main>
  );
}
