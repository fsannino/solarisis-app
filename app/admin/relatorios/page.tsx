import Link from "next/link";
import Image from "next/image";
import { OrderChannel, OrderStatus } from "@prisma/client";

import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";
import {
  type ReportPeriod,
  PERIOD_LABEL,
  getChannelBreakdown,
  getKpis,
  getSalesSeries,
  getStatusBreakdown,
  getTopCustomers,
  getTopProducts
} from "@/lib/reports";

const CHANNEL_LABEL: Record<OrderChannel, string> = {
  SITE: "Loja própria",
  ML: "Mercado Livre",
  SHOPEE: "Shopee",
  AMAZON: "Amazon",
  MAGALU: "Magalu",
  WHATSAPP: "WhatsApp"
};

const CHANNEL_COLOR: Record<OrderChannel, string> = {
  SITE: "#FF7A00",
  ML: "#FFD700",
  SHOPEE: "#EE4D2D",
  AMAZON: "#1A1614",
  MAGALU: "#0086FF",
  WHATSAPP: "#6FBF4A"
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Aguardando pagto",
  PAID: "Pago",
  PREPARING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
  RETURNED: "Devolvido"
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "#A89B8A",
  PAID: "#FF7A00",
  PREPARING: "#FF7A00",
  SHIPPED: "#FF7A00",
  DELIVERED: "#6FBF4A",
  CANCELED: "#C8462E",
  RETURNED: "#A89B8A"
};

const PERIODS: ReportPeriod[] = ["7d", "30d", "90d", "12m"];

function formatPercent(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const period: ReportPeriod = (
    PERIODS.includes(sp.p as ReportPeriod) ? sp.p : "30d"
  ) as ReportPeriod;

  const [kpis, series, channels, statusBreakdown, topProducts, topCustomers] =
    await Promise.all([
      getKpis(period),
      getSalesSeries(period),
      getChannelBreakdown(period),
      getStatusBreakdown(period),
      getTopProducts(period),
      getTopCustomers(period)
    ]);

  const totalChannelRevenue = channels.reduce((s, c) => s + c.revenue, 0);
  const totalStatusOrders = statusBreakdown.reduce((s, c) => s + c.count, 0);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Inteligência</p>
          <h1 className="display mt-3 text-[clamp(28px,3vw,36px)]">
            Relatórios
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            Período: últimos {PERIOD_LABEL[period]}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map((p) => {
            const active = p === period;
            return (
              <Link
                key={p}
                href={p === "30d" ? "/admin/relatorios" : `/admin/relatorios?p=${p}`}
                className={`rounded-md border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors ${
                  active
                    ? "border-ink bg-ink text-bone"
                    : "border-line text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </div>
      </header>

      {/* KPIs */}
      <section className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Receita"
          value={formatBRL(kpis.revenue)}
          delta={kpis.revenueDelta}
        />
        <KpiCard
          label="Pedidos"
          value={kpis.orders.toString()}
          delta={kpis.ordersDelta}
        />
        <KpiCard
          label="Ticket médio"
          value={kpis.aov > 0 ? formatBRL(kpis.aov) : "—"}
          delta={null}
        />
      </section>

      {/* Receita por dia */}
      <section className="mt-6 border border-line bg-surface p-5">
        <header className="mb-5 flex items-center justify-between">
          <p className="eyebrow">Receita por {period === "12m" ? "mês" : "dia"}</p>
          <p className="font-serif text-[18px] font-medium text-ink">
            {formatBRL(kpis.revenue)}
          </p>
        </header>
        <RevenueChart series={series} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Vendas por canal */}
        <section className="border border-line bg-surface p-5">
          <p className="eyebrow mb-4">Vendas por canal</p>
          {channels.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-soft">
              Sem vendas no período.
            </p>
          ) : (
            <>
              <div className="mb-4 flex h-7 overflow-hidden rounded">
                {channels.map((c) => (
                  <div
                    key={c.channel}
                    title={`${CHANNEL_LABEL[c.channel]}: ${formatBRL(c.revenue)}`}
                    style={{
                      width: `${(c.revenue / totalChannelRevenue) * 100}%`,
                      background: CHANNEL_COLOR[c.channel]
                    }}
                  />
                ))}
              </div>
              <ul className="flex flex-col gap-2.5">
                {channels.map((c) => {
                  const pct = (c.revenue / totalChannelRevenue) * 100;
                  return (
                    <li
                      key={c.channel}
                      className="flex items-center justify-between text-[13px]"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ background: CHANNEL_COLOR[c.channel] }}
                        />
                        <span className="text-ink">
                          {CHANNEL_LABEL[c.channel]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-ink-faint">
                          {pct.toFixed(1)}%
                        </span>
                        <span className="font-mono text-ink">
                          {formatBRL(c.revenue)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        {/* Status dos pedidos */}
        <section className="border border-line bg-surface p-5">
          <p className="eyebrow mb-4">
            Status dos pedidos · {totalStatusOrders} no período
          </p>
          {statusBreakdown.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-soft">
              Sem pedidos no período.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {statusBreakdown.map((s) => {
                const pct = (s.count / totalStatusOrders) * 100;
                return (
                  <li key={s.status} className="text-[13px]">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ background: STATUS_COLOR[s.status] }}
                        />
                        <span className="text-ink">
                          {STATUS_LABEL[s.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-ink-faint">
                          {pct.toFixed(1)}%
                        </span>
                        <span className="font-mono text-ink">{s.count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded bg-line">
                      <div
                        className="h-full"
                        style={{
                          width: `${pct}%`,
                          background: STATUS_COLOR[s.status]
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top produtos */}
        <section className="border border-line bg-surface">
          <header className="border-b border-line px-5 py-3.5">
            <p className="eyebrow">Top produtos</p>
          </header>
          {topProducts.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-soft">
              Sem dados de venda no período.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {topProducts.map((p, i) => (
                <li
                  key={p.variantId}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <span className="w-6 font-mono text-[12px] text-ink-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="relative h-12 w-9 shrink-0 overflow-hidden bg-sand">
                    {p.imageUrl && (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        sizes="36px"
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
                    {p.variantLabel && (
                      <p className="truncate text-[11px] text-ink-faint">
                        {p.variantLabel}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-serif text-[14px] font-medium text-ink">
                      {formatBRL(p.revenue)}
                    </span>
                    <span className="font-mono text-[11px] text-ink-faint">
                      {p.sold} un
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Top clientes */}
        <section className="border border-line bg-surface">
          <header className="border-b border-line px-5 py-3.5">
            <p className="eyebrow">Top clientes</p>
          </header>
          {topCustomers.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-soft">
              Sem clientes com pedidos no período.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {topCustomers.map((c, i) => {
                const ini =
                  c.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase() || "?";
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <span className="w-6 font-mono text-[12px] text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-soft font-mono text-[10px] font-bold text-orange">
                      {ini}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="block truncate text-[13px] font-medium text-ink hover:text-orange"
                      >
                        {c.name}
                      </Link>
                      <p className="truncate text-[11px] text-ink-faint">
                        {c.email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-serif text-[14px] font-medium text-ink">
                        {formatBRL(c.revenue)}
                      </span>
                      <span className="font-mono text-[11px] text-ink-faint">
                        {c.orders}{" "}
                        {c.orders === 1 ? "pedido" : "pedidos"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta
}: {
  label: string;
  value: string;
  delta: number | null;
}) {
  const positive = delta != null && delta >= 0;
  return (
    <div className="border border-line bg-surface p-5">
      <p className="text-[12px] font-medium text-ink-soft">{label}</p>
      <p className="display mt-2 text-[32px]">{value}</p>
      <div className="mt-3 text-[12px]">
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
        ) : (
          <span className="text-ink-faint">vs. período anterior</span>
        )}
      </div>
    </div>
  );
}

function RevenueChart({
  series
}: {
  series: { date: string; revenue: number }[];
}) {
  if (series.length === 0) {
    return (
      <p className="py-12 text-center text-[13px] text-ink-soft">
        Sem dados pra mostrar.
      </p>
    );
  }
  const w = 800;
  const h = 200;
  const max = Math.max(...series.map((s) => s.revenue), 1);
  const points = series.map((s, i) => {
    const x = (i / Math.max(series.length - 1, 1)) * w;
    const y = h - (s.revenue / max) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;

  return (
    <svg
      viewBox={`0 -10 ${w} ${h + 20}`}
      style={{ width: "100%", height: 220 }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FF7A00" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((p) => (
        <line
          key={p}
          x1="0"
          y1={h * p}
          x2={w}
          y2={h * p}
          stroke="rgba(26,22,20,0.12)"
          strokeDasharray="2 4"
        />
      ))}
      <path d={areaPath} fill="url(#grad)" />
      <path d={linePath} fill="none" stroke="#FF7A00" strokeWidth="2" />
      {series.length <= 30 &&
        points.map((p, i) => {
          const [x, y] = p.split(",");
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2.5"
              fill="white"
              stroke="#FF7A00"
              strokeWidth="2"
            />
          );
        })}
    </svg>
  );
}
