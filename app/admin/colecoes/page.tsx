import Link from "next/link";
import Image from "next/image";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export default async function CollectionsAdminPage() {
  await requireAdmin();

  const collections = await prisma.collection.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { products: true } }
    }
  });

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1 className="display mt-3 text-[clamp(28px,3vw,36px)]">
            Coleções
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {collections.length}{" "}
            {collections.length === 1 ? "coleção" : "coleções"} ·{" "}
            {collections.filter((c) => c.featured).length} em destaque
          </p>
        </div>
        <Link
          href="/admin/colecoes/novo"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nova coleção
        </Link>
      </header>

      <section className="mt-7">
        {collections.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface px-8 py-16 text-center">
            <p className="display text-[24px]">Nenhuma coleção ainda.</p>
            <p className="mt-2 text-[13px] text-ink-soft">
              Crie a primeira pra organizar seus produtos por temporada,
              estilo ou narrativa.
            </p>
            <Link
              href="/admin/colecoes/novo"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink"
            >
              Criar coleção
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/admin/colecoes/${c.id}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-all hover:-translate-y-0.5 hover:border-line-strong"
              >
                <div className="relative aspect-[3/2] overflow-hidden bg-sand">
                  {c.heroImageUrl && (
                    <Image
                      src={c.heroImageUrl}
                      alt={c.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      className="object-cover transition-transform group-hover:scale-[1.02]"
                    />
                  )}
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <StatusPill status={c.status} />
                    {c.featured && (
                      <span className="inline-flex items-center rounded-full bg-orange-soft px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-orange">
                        Destaque
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <p className="font-mono text-[10px] text-ink-faint">
                    /{c.slug}
                  </p>
                  <p className="font-serif text-[20px] font-medium text-ink">
                    {c.name}
                  </p>
                  {c.description && (
                    <p className="line-clamp-2 text-[13px] text-ink-soft">
                      {c.description}
                    </p>
                  )}
                  <p className="mt-2 text-[12px] text-ink-faint">
                    {c._count.products}{" "}
                    {c._count.products === 1 ? "produto" : "produtos"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, string> = {
    active: "bg-green/20 text-green",
    draft: "bg-line text-ink-soft"
  };
  const labels: Record<string, string> = {
    active: "Ativa",
    draft: "Rascunho"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[status] ?? ""}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
