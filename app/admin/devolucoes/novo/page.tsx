import Link from "next/link";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

import { createReturn } from "../_actions";
import { ItemsForm } from "./_items-form";

type SearchParams = { orderId?: string; q?: string };

export default async function NewReturnPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const orderId = sp.orderId?.trim();
  const q = sp.q?.trim();

  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { name: true, email: true } },
        items: {
          select: {
            id: true,
            productName: true,
            variantLabel: true,
            quantity: true,
            unitPrice: true
          }
        }
      }
    });
    if (!order) {
      return (
        <div>
          <Header />
          <p className="mt-8 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Pedido não encontrado.
          </p>
        </div>
      );
    }

    const items = order.items.map((it) => ({
      id: it.id,
      productName: it.productName,
      variantLabel: it.variantLabel,
      quantity: it.quantity,
      unitPrice: it.unitPrice.toNumber()
    }));

    return (
      <div>
        <Header />
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3">
          <div>
            <p className="font-mono text-[12px] text-ink-soft">
              Pedido <span className="font-medium text-ink">#{order.number}</span> ·{" "}
              {order.customer.name} · {order.customer.email}
            </p>
          </div>
          <Link
            href="/admin/devolucoes/novo"
            className="text-[12px] text-ink-faint hover:text-ink"
          >
            Trocar pedido
          </Link>
        </div>

        <div className="mt-6">
          <ItemsForm
            orderId={order.id}
            orderNumber={order.number}
            items={items}
            action={createReturn}
          />
        </div>
      </div>
    );
  }

  // Step 1: pick order
  const eligible = await prisma.order.findMany({
    where: {
      status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] },
      ...(q
        ? {
            OR: [
              { number: { contains: q, mode: "insensitive" } },
              { customer: { name: { contains: q, mode: "insensitive" } } },
              { customer: { email: { contains: q, mode: "insensitive" } } }
            ]
          }
        : {})
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      customer: { select: { name: true, email: true } },
      _count: { select: { items: true } }
    }
  });

  return (
    <div>
      <Header />

      <section className="mt-8 rounded-lg border border-line bg-surface p-5">
        <p className="eyebrow mb-3">1. Selecione o pedido</p>
        <form action="/admin/devolucoes/novo" className="flex flex-wrap gap-2.5">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por número, cliente ou e-mail..."
            className="h-9 flex-1 min-w-[260px] rounded-md border border-line bg-bone px-3 text-[13px] text-ink placeholder:text-ink-faint focus-visible:border-ink focus-visible:outline-none"
          />
          <button
            type="submit"
            className="h-9 rounded-md bg-ink px-4 text-[13px] font-medium text-bone hover:bg-orange"
          >
            Buscar
          </button>
        </form>

        {eligible.length === 0 ? (
          <p className="mt-6 text-center text-[13px] text-ink-soft">
            Nenhum pedido elegível encontrado.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {eligible.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-mono text-[13px] font-medium text-ink">
                    #{o.number}
                  </p>
                  <p className="text-[12px] text-ink-soft">
                    {o.customer.name} · {o.customer.email}
                  </p>
                  <p className="font-mono text-[10px] text-ink-faint">
                    {o.createdAt.toLocaleDateString("pt-BR")} ·{" "}
                    {o._count.items}{" "}
                    {o._count.items === 1 ? "item" : "itens"} ·{" "}
                    {formatBRL(o.total.toNumber())}
                  </p>
                </div>
                <Link
                  href={`/admin/devolucoes/novo?orderId=${o.id}`}
                  className="rounded-full bg-ink px-4 py-2 text-[12px] font-semibold text-bone hover:bg-orange"
                >
                  Selecionar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-3 border-b border-line pb-7">
      <Link
        href="/admin/devolucoes"
        className="inline-flex w-fit items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
      >
        ← Devoluções
      </Link>
      <p className="eyebrow">Vendas</p>
      <h1 className="display text-[clamp(28px,3vw,36px)]">Nova devolução</h1>
      <p className="text-[13px] text-ink-soft">
        Registre uma devolução pra um pedido pago, em separação, enviado ou
        entregue.
      </p>
    </header>
  );
}
