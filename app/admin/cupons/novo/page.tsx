import Link from "next/link";

import { requireAdmin } from "@/lib/auth-helpers";

import { createCoupon } from "../_actions";
import { CouponForm } from "../_form";

export default async function NewCouponPage() {
  await requireAdmin();
  const today = new Date().toISOString().slice(0, 16);

  return (
    <div>
      <header className="flex flex-col gap-3 border-b border-line pb-7">
        <Link
          href="/admin/cupons"
          className="inline-flex w-fit items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
        >
          ← Cupons
        </Link>
        <p className="eyebrow">Vendas</p>
        <h1 className="display text-[clamp(28px,3vw,36px)]">
          Novo cupom
        </h1>
        <p className="text-[13px] text-ink-soft">
          Crie um cupom de desconto pra distribuir em campanhas, parceiros ou
          recuperação de carrinho.
        </p>
      </header>

      <div className="mt-8">
        <CouponForm
          action={createCoupon}
          submitLabel="Criar cupom"
          defaultValues={{ validFrom: today, status: "active", type: "PERCENT" }}
        />
      </div>
    </div>
  );
}
