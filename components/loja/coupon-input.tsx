"use client";

import { useState } from "react";

import { formatBRL } from "@/lib/utils";

export type AppliedCoupon = {
  code: string;
  discount: number;
  freeShipping: boolean;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
};

export function CouponInput({
  applied,
  onApply,
  onClear
}: {
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onClear: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Cupom inválido.");
        return;
      }
      onApply({
        code: data.code,
        discount: data.discount,
        freeShipping: data.freeShipping,
        type: data.type
      });
      setCode("");
    } catch {
      setError("Não foi possível validar o cupom.");
    } finally {
      setBusy(false);
    }
  }

  if (applied) {
    return (
      <div className="rounded-lg border border-orange/40 bg-orange-soft px-4 py-3">
        <input type="hidden" name="couponCode" value={applied.code} />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.04em] text-orange">
              ✓ {applied.code}
            </p>
            <p className="mt-0.5 text-[12px] text-ink">
              {applied.freeShipping
                ? "Frete grátis aplicado"
                : `Desconto: ${formatBRL(applied.discount)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-ink-soft underline-offset-4 hover:text-destructive hover:underline"
          >
            Remover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Código do cupom"
          className="h-10 flex-1 rounded-md border border-line-strong bg-bone px-3 font-mono text-[13px] uppercase tracking-[0.04em] text-ink placeholder:text-ink-faint focus-visible:border-ink focus-visible:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={busy || !code.trim()}
          className="h-10 rounded-md bg-ink px-4 text-[12px] font-semibold text-bone transition-colors hover:bg-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-ink"
        >
          {busy ? "..." : "Aplicar"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-[11px] text-destructive">{error}</p>
      )}
    </div>
  );
}
