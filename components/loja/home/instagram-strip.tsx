import Link from "next/link";
import Image from "next/image";
import { INSTA_GRID } from "@/lib/home-content";

export function InstagramStrip() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-30 md:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3.5">@solarisismoda</p>
          <h2 className="display text-[clamp(34px,4vw,48px)]">
            Marque <em className="not-italic italic">#vistaosol</em>
          </h2>
        </div>
        <Link
          href="https://instagram.com/solarisismoda"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:text-orange md:inline-flex md:items-center md:gap-1.5"
        >
          Seguir no Instagram <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {INSTA_GRID.map((src, i) => (
          <div
            key={src + i}
            className="group relative aspect-square cursor-pointer overflow-hidden bg-sand"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="(min-width: 768px) 16vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
