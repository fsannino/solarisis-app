import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

import {
  addProductToCollection,
  deleteCollection,
  removeProductFromCollection,
  updateCollection
} from "../_actions";
import { CollectionForm } from "../_form";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditCollectionPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              status: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true, alt: true }
              }
            }
          }
        }
      }
    }
  });
  if (!collection) notFound();

  const insideIds = new Set(collection.products.map((cp) => cp.productId));
  const outsideProducts = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      id: { notIn: Array.from(insideIds) }
    },
    take: 50,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      sku: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true, alt: true }
      }
    }
  });

  const update = updateCollection.bind(null, collection.id);

  async function handleDelete() {
    "use server";
    await deleteCollection(collection!.id);
  }

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-7">
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/colecoes"
            className="inline-flex items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
          >
            ← Coleções
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="display text-[clamp(28px,3vw,36px)]">
              {collection.name}
            </h1>
            <StatusPill status={collection.status} />
            {collection.featured && (
              <span className="inline-flex items-center rounded-full bg-orange-soft px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-orange">
                Em destaque
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] text-ink-soft">
            /{collection.slug} · {collection.products.length} produtos
          </p>
        </div>
        <form action={handleDelete}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            Apagar coleção
          </button>
        </form>
      </header>

      <div className="mt-8">
        <CollectionForm
          action={update}
          submitLabel="Salvar alterações"
          defaultValues={{
            name: collection.name,
            slug: collection.slug,
            description: collection.description ?? "",
            heroImageUrl: collection.heroImageUrl ?? "",
            featured: collection.featured,
            status: collection.status as "active" | "draft",
            order: collection.order
          }}
        />
      </div>

      {/* Produtos da coleção */}
      <section className="mt-12 border-t border-line pt-10">
        <header className="mb-5">
          <p className="eyebrow">Produtos na coleção</p>
          <h2 className="display mt-2 text-[24px]">
            {collection.products.length} produtos
          </h2>
        </header>
        {collection.products.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface px-5 py-8 text-center text-[13px] text-ink-soft">
            Nenhum produto ainda. Adicione abaixo.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {collection.products.map((cp) => (
              <li
                key={cp.productId}
                className="flex items-center gap-3 rounded-md border border-line bg-surface p-3"
              >
                <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-sand">
                  {cp.product.images[0] && (
                    <Image
                      src={cp.product.images[0].url}
                      alt={cp.product.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/produtos/${cp.product.id}`}
                    className="block truncate text-[13px] font-medium text-ink hover:text-orange"
                  >
                    {cp.product.name}
                  </Link>
                  <p className="font-mono text-[10px] text-ink-faint">
                    {cp.product.sku}
                  </p>
                </div>
                <form action={removeProductFromCollection}>
                  <input
                    type="hidden"
                    name="collectionId"
                    value={collection.id}
                  />
                  <input
                    type="hidden"
                    name="productId"
                    value={cp.productId}
                  />
                  <button
                    type="submit"
                    aria-label="Remover"
                    className="text-ink-soft hover:text-destructive"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {/* Adicionar produtos */}
        {outsideProducts.length > 0 && (
          <div className="mt-8">
            <p className="eyebrow mb-4">Adicionar produtos</p>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {outsideProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-md border border-line bg-bone p-3"
                >
                  <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-sand">
                    {p.images[0] && (
                      <Image
                        src={p.images[0].url}
                        alt={p.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {p.name}
                    </p>
                    <p className="font-mono text-[10px] text-ink-faint">
                      {p.sku}
                    </p>
                  </div>
                  <form action={addProductToCollection}>
                    <input
                      type="hidden"
                      name="collectionId"
                      value={collection.id}
                    />
                    <input
                      type="hidden"
                      name="productId"
                      value={p.id}
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-bone hover:bg-orange"
                    >
                      + Adicionar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
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
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[status] ?? ""}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
