import Link from "next/link";
import Image from "next/image";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Aguardando pagto",
  PAID: "Pago",
  PREPARING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
  RETURNED: "Devolvido"
};

function formatPercent(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

async function loadKpis() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const last30Start = new Date(now);
  last30Start.setDate(now.getDate() - 30);

  const previous30Start = new Date(last30Start);
  previous30Start.setDate(last30Start.getDate() - 30);

  const [
    todayPaidCount,
    revenue30,
    revenuePrev30,
    customers30Count,
    customersPrev30Count,
    orders30Stats
  ] = await Promise.all([
    prisma.order.count({
      where: {
        paidAt: { gte: startOfDay },
        paymentStatus: "PAID"
      }
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        paidAt: { gte: last30Start, lte: now },
        paymentStatus: "PAID"
      }
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        paidAt: { gte: previous30Start, lt: last30Start },
        paymentStatus: "PAID"
      }
    }),
    prisma.customer.count({
      where: { createdAt: { gte: last30Start } }
    }),
    prisma.customer.count({
      where: {
        createdAt: { gte: previous30Start, lt: last30Start }
      }
    }),
    prisma.order.aggregate({
      _avg: { total: true },
      _count: { _all: true },
      where: {
        paidAt: { gte: last30Start, lte: now },
        paymentStatus: "PAID"
      }
    })
  ]);

  const revenueValue = Number(revenue30._sum.total ?? 0);
  const prevRevenueValue = Number(revenuePrev30._sum.total ?? 0);
  const revenueDelta =
    prevRevenueValue > 0
      ? ((revenueValue - prevRevenueValue) / prevRevenueValue) * 100
      : 0;

  const customersDelta =
    customersPrev30Count > 0
      ? ((customers30Count - customersPrev30Count) /
          customersPrev30Count) *
        100
      : 0;

  return {
    todayPaidCount,
    revenue30: revenueValue,
    revenue30Delta: revenueDelta,
    customers30Count,
    customers30Delta: customersDelta,
    avgOrder: Number(orders30Stats._avg.total ?? 0),
    orders30Count: orders30Stats._count._all
  };
}

async function loadRecentOrders() {
  return prisma.order.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, email: true } }
    }
  });
}

async function loadTopProducts() {
  const grouped = await prisma.orderItem.groupBy({
    by: ["variantId"],
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5
  });

  if (grouped.length === 0) return [];

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: grouped.map((g) => g.variantId) } },
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 }
        }
      }
    }
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  return grouped
    .map((g) => {
      const v = variantMap.get(g.variantId);
      if (!v) return null;
      return {
        id: v.id,
        productId: v.productId,
        name: v.product.name,
        image: v.product.images[0]?.url ?? null,
        sold: g._sum.quantity ?? 0,
        revenue: Number(g._sum.totalPrice ?? 0)
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
}

async function loadAlerts() {
  const lowStock = await prisma.productVariant.findMany({
    where: { stock: { gt: 0, lt: 5 } },
    take: 3,
    select: {
      id: true,
      sku: true,
      stock: true,
      product: { select: { id: true, name: true } }
    }
  });
  const outOfStock = await prisma.productVariant.count({
    where: { stock: 0 }
  });
  const pendingOrders = await prisma.order.count({
    where: { status: "PENDING" }
  });

  const alerts: { sev: "high" | "med" | "low"; title: string; href: string }[] =
    [];
  if (pendingOrders > 0) {
    alerts.push({
      sev: "med",
      title: `${pendingOrders} pedido${pendingOrders > 1 ? "s" : ""} aguardando pagamento`,
      href: "/admin/pedidos?status=PENDING"
    });
  }
  if (outOfStock > 0) {
    alerts.push({
      sev: "high",
      title: `${outOfStock} variante${outOfStock > 1 ? "s" : ""} sem estoque`,
      href: "/admin/produtos"
    });
  }
  for (const v of lowStock) {
    alerts.push({
      sev: "low",
      title: `Estoque baixo · ${v.product.name} (${v.sku}) — ${v.stock} restantes`,
      href: `/admin/produtos/${v.product.id}`
    });
  }
  return alerts;
}

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const [kpis, recent, topProducts, alerts] = await Promise.all([
    loadKpis(),
    loadRecentOrders(),
    loadTopProducts(),
    loadAlerts()
  ]);

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long"
  });
  const firstName =
    session.user.name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? "";
  const greeting = `Bom dia, ${firstName || "tudo bem"}`;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-7">
        <div>
          <p className="eyebrow">{today}</p>
          <h1 className="display mt-3 text-[clamp(32px,3.5vw,44px)]">
            {greeting}
            {firstName ? "." : ""}
          </h1>
          <p className="mt-2 max-w-[640px] text-[14px] text-ink-soft">
            Resumo dos últimos 30 dias.{" "}
            {alerts.length > 0
              ? `Você tem ${alerts.length} ${alerts.length === 1 ? "item que precisa" : "itens que precisam"} de atenção.`
              : "Nada urgente por aqui."}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/produtos/novo"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo produto
          </Link>
        </div>
      </header>

      {/* KPIs */}
      <section className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Pedidos pagos hoje"
          value={kpis.todayPaidCount.toString()}
          delta={null}
        />
        <KpiCard
          label="Receita · 30 dias"
          value={formatBRL(kpis.revenue30)}
          delta={kpis.revenue30Delta}
        />
        <KpiCard
          label="Novos clientes · 30d"
          value={kpis.customers30Count.toString()}
          delta={kpis.customers30Delta}
        />
        <KpiCard
          label="Ticket médio · 30d"
          value={kpis.avgOrder > 0 ? formatBRL(kpis.avgOrder) : "—"}
          delta={null}
          subtitle={
            kpis.orders30Count > 0
              ? `${kpis.orders30Count} pedido${kpis.orders30Count > 1 ? "s" : ""}`
              : undefined
          }
        />
      </section>

      {/* Alerts */}
      {alerts.length > 0 && (
        <section className="mt-6 border border-line bg-surface">
          <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-orange">
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span className="text-[14px] font-semibold text-ink">
                Atenção necessária
              </span>
              <span className="rounded-full bg-orange-soft px-2 py-0.5 font-mono text-[10px] font-bold text-orange">
                {alerts.length}
              </span>
            </div>
          </header>
          <ul>
            {alerts.map((a, i) => (
              <li
                key={i}
                className={`flex items-center justify-between px-5 py-3.5 ${i < alerts.length - 1 ? "border-b border-line" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`h-2 w-2 rounded-full ${
                      a.sev === "high"
                        ? "bg-destructive"
                        : a.sev === "med"
                          ? "bg-orange"
                          : "bg-ink-faint"
                    }`}
                  />
                  <span className="text-[14px] text-ink">{a.title}</span>
                </div>
                <Link
                  href={a.href}
                  className="rounded-full border border-line-strong px-3.5 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  Resolver →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recentes + Top produtos */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="border border-line bg-surface">
          <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <p className="eyebrow">Pedidos recentes</p>
            <Link
              href="/admin/pedidos"
              className="text-[12px] font-semibold text-orange hover:underline"
            >
              Ver todos →
            </Link>
          </header>
          {recent.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-soft">
              Quando o primeiro pedido entrar, aparece aqui.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li
                  key={o.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/pedidos/${o.number}`}
                      className="truncate text-[13px] font-medium text-ink hover:text-orange"
                    >
                      {o.customer.name}
                    </Link>
                    <p className="truncate font-mono text-[11px] text-ink-faint">
                      #{o.number} · {o.customer.email}
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-soft px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-orange">
                    {STATUS_LABEL[o.status]}
                  </span>
                  <span className="font-serif text-[14px] font-medium text-ink">
                    {formatBRL(o.total.toNumber())}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-line bg-surface p-5">
          <p className="eyebrow">Top produtos · 30d</p>
          {topProducts.length === 0 ? (
            <p className="mt-6 text-[13px] text-ink-soft">
              Sem dados de venda ainda.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3.5">
              {topProducts.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="w-6 font-mono text-[13px] text-ink-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-sand">
                    {p.image && (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/produtos/${p.productId}`}
                      className="block truncate text-[13px] font-medium text-ink hover:text-orange"
                    >
                      {p.name}
                    </Link>
                    <p className="text-[11px] text-ink-faint">
                      {p.sold} {p.sold === 1 ? "vendido" : "vendidos"}
                    </p>
                  </div>
                  <span className="font-serif text-[14px] font-medium text-ink">
                    {formatBRL(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  subtitle
}: {
  label: string;
  value: string;
  delta: number | null;
  subtitle?: string;
}) {
  const positive = delta != null && delta >= 0;
  return (
    <div className="border border-line bg-surface p-5">
      <p className="text-[12px] font-medium text-ink-soft">{label}</p>
      <p className="display mt-2 text-[28px]">{value}</p>
      <div className="mt-3 flex items-center gap-2 text-[12px]">
        {delta != null ? (
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              positive ? "text-green" : "text-destructive"
            }`}
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {positive ? (
                <path d="M12 19V5M5 12l7-7 7 7" />
              ) : (
                <path d="M12 5v14M5 12l7 7 7-7" />
              )}
            </svg>
            {formatPercent(delta)}
          </span>
        ) : subtitle ? (
          <span className="text-ink-faint">{subtitle}</span>
        ) : (
          <span className="text-ink-faint">vs. período anterior</span>
        )}
      </div>
    </div>
  );
}
