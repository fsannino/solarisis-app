import Link from "next/link";
import { Prisma, OrderStatus, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

type SearchParams = {
  status?: string;
  q?: string;
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Aguardando pagto" },
  { value: "PAID", label: "Pago" },
  { value: "PREPARING", label: "Em separação" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELED", label: "Cancelado" }
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Aguardando pagto",
  PAID: "Pago",
  PREPARING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
  RETURNED: "Devolvido"
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  PENDING: "—",
  AUTHORIZED: "Autorizado",
  PAID: "Pago",
  REFUNDED: "Reembolsado",
  FAILED: "Falhou",
  CANCELED: "Cancelado"
};

function buildHref(sp: SearchParams, override: Partial<SearchParams>) {
  const params = new URLSearchParams();
  const merged = { ...sp, ...override };
  if (merged.status) params.set("status", merged.status);
  if (merged.q) params.set("q", merged.q);
  const qs = params.toString();
  return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
}

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = sp.status?.trim();
  const q = sp.q?.trim();

  const where: Prisma.OrderWhereInput = {};
  if (
    status &&
    ["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELED", "RETURNED"].includes(
      status
    )
  ) {
    where.status = status as OrderStatus;
  }
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { email: { contains: q, mode: "insensitive" } } }
    ];
  }

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        customer: { select: { name: true, email: true } },
        items: { select: { quantity: true } }
      }
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true }
    })
  ]);

  const countMap = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all])
  );
  const totalAll = counts.reduce((s, c) => s + c._count._all, 0);

  return (
    <div>
      <header className="border-line border-b pb-6">
        <p className="text-ink-soft text-xs uppercase tracking-widest">Vendas</p>
        <h1 className="font-serif mt-1 text-3xl italic">Pedidos</h1>
      </header>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex flex-wrap gap-1.5 text-sm">
          {STATUS_TABS.map((t) => {
            const active =
              (t.value === "" && !status) || t.value === status;
            const count =
              t.value === "" ? totalAll : countMap[t.value] ?? 0;
            return (
              <Link
                key={t.value || "all"}
                href={buildHref(sp, { status: t.value || undefined })}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? "border-orange bg-orange-soft text-ink"
                    : "border-line text-ink-soft hover:border-line-strong hover:text-ink"
                }`}
              >
                {t.label}{" "}
                <span className="text-ink-faint ml-1">{count}</span>
              </Link>
            );
          })}
        </nav>

        <form action="/admin/pedidos" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Número, cliente, email"
            className="border-line-strong bg-surface text-ink placeholder:text-ink-faint focus-visible:ring-orange h-9 w-64 rounded-md border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          />
          <button
            type="submit"
            className="bg-ink hover:bg-ink-soft text-surface h-9 rounded-md px-4 text-sm transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      <section className="mt-6">
        {orders.length === 0 ? (
          <div className="bg-surface border-line rounded-lg border px-8 py-16 text-center">
            <p className="font-serif text-xl italic">Nenhum pedido aqui ainda.</p>
            <p className="text-ink-soft mt-2 text-sm">
              {status || q
                ? "Ajuste os filtros pra ver mais."
                : "Quando o primeiro pedido entrar, aparece nessa lista."}
            </p>
          </div>
        ) : (
          <div className="bg-surface border-line overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-line text-ink-soft border-b text-left text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-medium">Pedido</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Itens</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Pagamento</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {orders.map((o) => {
                  const itemCount = o.items.reduce(
                    (s, i) => s + i.quantity,
                    0
                  );
                  return (
                    <tr key={o.id} className="hover:bg-bg">
                      <td className="text-ink px-4 py-3 font-mono text-xs">
                        #{o.number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-ink leading-tight">
                          {o.customer.name}
                        </div>
                        <div className="text-ink-faint text-xs leading-tight">
                          {o.customer.email}
                        </div>
                      </td>
                      <td className="text-ink-soft px-4 py-3">{itemCount}</td>
                      <td className="text-ink px-4 py-3">
                        {formatBRL(o.total.toNumber())}
                      </td>
                      <td className="text-ink-soft px-4 py-3">
                        {PAYMENT_LABEL[o.paymentStatus]}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={o.status} />
                      </td>
                      <td className="text-ink-soft px-4 py-3 whitespace-nowrap text-xs">
                        {o.createdAt.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short"
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/pedidos/${o.number}`}
                          className="text-ink-soft hover:text-ink text-xs underline"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const tones: Record<OrderStatus, string> = {
    PENDING: "bg-bg text-ink-soft",
    PAID: "bg-orange-soft text-ink",
    PREPARING: "bg-orange-soft text-ink",
    SHIPPED: "bg-orange-soft text-ink",
    DELIVERED: "bg-line text-ink",
    CANCELED: "bg-bg text-ink-faint",
    RETURNED: "bg-bg text-ink-faint"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
