import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MovementType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

import { AdjustForm } from "./adjust-form";

const TYPE_LABEL: Record<MovementType, string> = {
  IN: "Entrada",
  OUT: "Saída",
  ADJUSTMENT: "Ajuste",
  TRANSFER: "Transferência",
  RESERVED: "Reserva",
  RELEASED: "Reserva liberada"
};

const TYPE_TONE: Record<MovementType, string> = {
  IN: "bg-green/20 text-green",
  OUT: "bg-destructive/15 text-destructive",
  ADJUSTMENT: "bg-orange-soft text-orange",
  TRANSFER: "bg-line text-ink-soft",
  RESERVED: "bg-line text-ink-soft",
  RELEASED: "bg-line text-ink-soft"
};

function formatDateTime(d: Date) {
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ variantId: string }>;
}): Promise<Metadata> {
  const { variantId } = await params;
  const v = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { sku: true, product: { select: { name: true } } }
  });
  return {
    title: v ? `Estoque · ${v.product.name} (${v.sku})` : "Estoque"
  };
}

export default async function VariantStockPage({
  params
}: {
  params: Promise<{ variantId: string }>;
}) {
  await requireAdmin();
  const { variantId } = await params;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, alt: true }
          }
        }
      },
      movements: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          createdBy: { select: { name: true, email: true } }
        }
      }
    }
  });

  if (!variant) notFound();

  const variantLabel = [variant.color, variant.size]
    .filter(Boolean)
    .join(" · ");
  const stockTone =
    variant.stock === 0
      ? "bg-destructive/15 text-destructive"
      : variant.stock < 5
        ? "bg-orange-soft text-orange"
        : "bg-green/20 text-green";

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-5 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em]">
        <Link href="/admin/estoque" className="text-ink-soft hover:text-ink">
          ← Estoque
        </Link>
        <span className="text-ink-faint">/</span>
        <span className="text-ink">{variant.product.name}</span>
      </nav>

      {/* Header */}
      <header className="rounded-lg border border-line bg-surface p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-5">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-sand">
              {variant.product.images[0] && (
                <Image
                  src={variant.product.images[0].url}
                  alt={variant.product.images[0].alt ?? variant.product.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <h1 className="display text-[clamp(24px,2.5vw,28px)]">
                {variant.product.name}
              </h1>
              <p className="mt-1.5 text-[13px] text-ink-soft">
                {variantLabel || "—"}
              </p>
              <p className="mt-1 font-mono text-[11px] text-ink-faint">
                SKU {variant.sku}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="display text-[48px] leading-none text-ink">
              {variant.stock}
              <span className="ml-2 text-[16px] text-ink-soft">un</span>
            </p>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${stockTone}`}
            >
              {variant.stock === 0
                ? "Esgotado"
                : variant.stock < 5
                  ? "Crítico"
                  : "OK"}
            </span>
            <Link
              href={`/admin/produtos/${variant.product.id}`}
              className="text-[11px] text-ink-soft underline-offset-4 hover:text-ink hover:underline"
            >
              Editar produto →
            </Link>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Form */}
        <section className="rounded-lg border border-line bg-surface p-5">
          <p className="eyebrow mb-5">Ajustar estoque</p>
          <AdjustForm
            variantId={variant.id}
            currentStock={variant.stock}
          />
        </section>

        {/* Histórico */}
        <section className="rounded-lg border border-line bg-surface">
          <header className="border-b border-line px-5 py-3.5">
            <p className="eyebrow">Histórico</p>
          </header>
          {variant.movements.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-soft">
              Sem movimentações registradas ainda.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {variant.movements.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start justify-between gap-3 px-5 py-3.5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${TYPE_TONE[m.type]}`}
                      >
                        {TYPE_LABEL[m.type]}
                      </span>
                      <span className="font-mono text-[12px] font-bold text-ink">
                        {m.type === MovementType.OUT ||
                        m.type === MovementType.RESERVED
                          ? "−"
                          : "+"}
                        {m.quantity}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-ink">{m.reason}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                      {formatDateTime(m.createdAt)}
                      {m.createdBy?.name && ` · ${m.createdBy.name}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
