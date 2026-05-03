import { OrderChannel, OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export type ReportPeriod = "7d" | "30d" | "90d" | "12m";

export const PERIOD_LABEL: Record<ReportPeriod, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  "12m": "12 meses"
};

export function periodToDays(p: ReportPeriod): number {
  switch (p) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "12m":
      return 365;
  }
}

export type SalesPoint = { date: string; revenue: number; orders: number };

/**
 * Agrega receita e pedidos pagos por dia (ou por mês quando period="12m").
 * Retorna sempre uma série completa (preenche dias sem venda com 0).
 */
export async function getSalesSeries(period: ReportPeriod): Promise<SalesPoint[]> {
  const days = periodToDays(period);
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      paidAt: { gte: start },
      paymentStatus: "PAID"
    },
    select: { paidAt: true, total: true }
  });

  const buckets = new Map<string, { revenue: number; orders: number }>();
  const useMonth = period === "12m";

  // Inicializa buckets vazios pra preencher buracos
  if (useMonth) {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.set(monthKey(d), { revenue: 0, orders: 0 });
    }
  } else {
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i + 1);
      buckets.set(dayKey(d), { revenue: 0, orders: 0 });
    }
  }

  for (const o of orders) {
    if (!o.paidAt) continue;
    const key = useMonth ? monthKey(o.paidAt) : dayKey(o.paidAt);
    const cur = buckets.get(key);
    if (!cur) continue;
    cur.revenue += o.total.toNumber();
    cur.orders += 1;
  }

  return Array.from(buckets.entries()).map(([date, b]) => ({
    date,
    revenue: Number(b.revenue.toFixed(2)),
    orders: b.orders
  }));
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export type ChannelBreakdownItem = {
  channel: OrderChannel;
  orders: number;
  revenue: number;
};

export async function getChannelBreakdown(
  period: ReportPeriod
): Promise<ChannelBreakdownItem[]> {
  const start = new Date();
  start.setDate(start.getDate() - periodToDays(period));

  const result = await prisma.order.groupBy({
    by: ["channel"],
    _sum: { total: true },
    _count: { _all: true },
    where: {
      paidAt: { gte: start },
      paymentStatus: "PAID"
    }
  });

  return result
    .map((r) => ({
      channel: r.channel,
      orders: r._count._all,
      revenue: Number(r._sum.total ?? 0)
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export type StatusBreakdownItem = {
  status: OrderStatus;
  count: number;
};

export async function getStatusBreakdown(
  period: ReportPeriod
): Promise<StatusBreakdownItem[]> {
  const start = new Date();
  start.setDate(start.getDate() - periodToDays(period));

  const result = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
    where: { createdAt: { gte: start } }
  });
  return result.map((r) => ({
    status: r.status,
    count: r._count._all
  }));
}

export type TopProductRow = {
  variantId: string;
  productId: string;
  name: string;
  variantLabel: string | null;
  imageUrl: string | null;
  sold: number;
  revenue: number;
};

export async function getTopProducts(
  period: ReportPeriod,
  limit = 10
): Promise<TopProductRow[]> {
  const start = new Date();
  start.setDate(start.getDate() - periodToDays(period));

  const grouped = await prisma.orderItem.groupBy({
    by: ["variantId"],
    _sum: { quantity: true, totalPrice: true },
    where: {
      order: {
        paidAt: { gte: start },
        paymentStatus: "PAID"
      }
    },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit
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

  const rows: TopProductRow[] = [];
  for (const g of grouped) {
    const v = variantMap.get(g.variantId);
    if (!v) continue;
    rows.push({
      variantId: v.id,
      productId: v.productId,
      name: v.product.name,
      variantLabel: [v.color, v.size].filter(Boolean).join(" · ") || null,
      imageUrl: v.product.images[0]?.url ?? null,
      sold: g._sum.quantity ?? 0,
      revenue: Number(g._sum.totalPrice ?? 0)
    });
  }
  return rows;
}

export type TopCustomerRow = {
  id: string;
  name: string;
  email: string;
  orders: number;
  revenue: number;
};

export async function getTopCustomers(
  period: ReportPeriod,
  limit = 10
): Promise<TopCustomerRow[]> {
  const start = new Date();
  start.setDate(start.getDate() - periodToDays(period));

  const grouped = await prisma.order.groupBy({
    by: ["customerId"],
    _sum: { total: true },
    _count: { _all: true },
    where: {
      paidAt: { gte: start },
      paymentStatus: "PAID"
    },
    orderBy: { _sum: { total: "desc" } },
    take: limit
  });

  if (grouped.length === 0) return [];

  const customers = await prisma.customer.findMany({
    where: { id: { in: grouped.map((g) => g.customerId) } },
    select: { id: true, name: true, email: true }
  });
  const map = new Map(customers.map((c) => [c.id, c]));

  const rows: TopCustomerRow[] = [];
  for (const g of grouped) {
    const c = map.get(g.customerId);
    if (!c) continue;
    rows.push({
      id: c.id,
      name: c.name,
      email: c.email,
      orders: g._count._all,
      revenue: Number(g._sum.total ?? 0)
    });
  }
  return rows;
}

export async function getKpis(period: ReportPeriod) {
  const days = periodToDays(period);
  const start = new Date();
  start.setDate(start.getDate() - days);

  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - days);

  const [current, previous] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      _count: { _all: true },
      _avg: { total: true },
      where: {
        paidAt: { gte: start },
        paymentStatus: "PAID"
      }
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      _count: { _all: true },
      where: {
        paidAt: { gte: previousStart, lt: start },
        paymentStatus: "PAID"
      }
    })
  ]);

  const revenue = Number(current._sum.total ?? 0);
  const prevRevenue = Number(previous._sum.total ?? 0);
  const orders = current._count._all;
  const prevOrders = previous._count._all;
  const aov = Number(current._avg.total ?? 0);

  return {
    revenue,
    revenueDelta:
      prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0,
    orders,
    ordersDelta:
      prevOrders > 0 ? ((orders - prevOrders) / prevOrders) * 100 : 0,
    aov
  };
}
