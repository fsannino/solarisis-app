import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

import {
  activateCoupon,
  pauseCoupon,
  updateCoupon
} from "../_actions";
import { CouponForm } from "../_form";

type PageProps = { params: Promise<{ id: string }> };

function toLocalInput(d: Date | null) {
  if (!d) return "";
  // Converte pra "yyyy-MM-ddThh:mm" no fuso local
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

export default async function EditCouponPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) notFound();

  const update = updateCoupon.bind(null, coupon.id);

  async function handlePause() {
    "use server";
    await pauseCoupon(coupon!.id);
  }
  async function handleActivate() {
    "use server";
    await activateCoupon(coupon!.id);
  }

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-7">
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/cupons"
            className="inline-flex items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
          >
            ← Cupons
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="display font-mono text-[clamp(28px,3vw,36px)] uppercase tracking-[0.04em]">
              {coupon.code}
            </h1>
            <StatusPill status={coupon.status} />
          </div>
          <p className="font-mono text-[11px] text-ink-soft">
            {coupon.usedCount}{" "}
            {coupon.maxUses ? `/ ${coupon.maxUses}` : "usos"} ·{" "}
            {coupon.usedCount === 1 ? "1 pedido aplicou" : `${coupon.usedCount} pedidos aplicaram`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {coupon.status === "active" ? (
            <form action={handlePause}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-[12px] font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-bone"
              >
                Pausar
              </button>
            </form>
          ) : coupon.status === "paused" ? (
            <form action={handleActivate}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-orange/40 px-4 py-2 text-[12px] font-medium text-orange transition-colors hover:bg-orange hover:text-white"
              >
                Reativar
              </button>
            </form>
          ) : null}
        </div>
      </header>

      <div className="mt-8">
        <CouponForm
          action={update}
          submitLabel="Salvar alterações"
          defaultValues={{
            code: coupon.code,
            type: coupon.type,
            value: String(coupon.value),
            minOrderValue:
              coupon.minOrderValue != null
                ? String(coupon.minOrderValue)
                : "",
            maxUses: coupon.maxUses != null ? String(coupon.maxUses) : "",
            perCustomerLimit:
              coupon.perCustomerLimit != null
                ? String(coupon.perCustomerLimit)
                : "",
            validFrom: toLocalInput(coupon.validFrom),
            validUntil: toLocalInput(coupon.validUntil),
            status: coupon.status as "active" | "paused" | "expired"
          }}
        />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, string> = {
    active: "bg-green/20 text-green",
    paused: "bg-line text-ink-soft",
    expired: "bg-line text-ink-faint"
  };
  const labels: Record<string, string> = {
    active: "Ativo",
    paused: "Pausado",
    expired: "Expirado"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[status] ?? ""}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
