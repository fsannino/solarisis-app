"use client";

import { useMemo, useState, useTransition } from "react";
import { addToCart } from "@/app/(loja)/_actions";
import { cn, formatBRL } from "@/lib/utils";

export type VariantOption = {
  id: string;
  color: string | null;
  size: string | null;
  stock: number;
  priceOverride: number | null;
};

type Props = {
  variants: VariantOption[];
  basePrice: number;
  salePrice: number | null;
};

export function VariantSelector({ variants, basePrice, salePrice }: Props) {
  const colors = useMemo(() => {
    const set = new Set<string>();
    for (const v of variants) if (v.color) set.add(v.color);
    return Array.from(set);
  }, [variants]);

  const initialColor = colors[0] ?? null;
  const [color, setColor] = useState<string | null>(initialColor);

  const sizesForColor = useMemo(() => {
    return variants
      .filter((v) => (color ? v.color === color : true))
      .filter((v) => v.size != null);
  }, [variants, color]);

  const initialSize = sizesForColor[0]?.size ?? null;
  const [size, setSize] = useState<string | null>(initialSize);

  const selected = useMemo(() => {
    return (
      variants.find((v) => v.color === color && v.size === size) ??
      variants.find((v) => (color ? v.color === color : true)) ??
      null
    );
  }, [variants, color, size]);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "error";
    msg: string;
  } | null>(null);

  const price = selected?.priceOverride ?? salePrice ?? basePrice;
  const showStrikethrough =
    salePrice != null &&
    salePrice < basePrice &&
    selected?.priceOverride == null;
  const outOfStock = !selected || selected.stock === 0;

  function handleAdd() {
    if (!selected) return;
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("variantId", selected.id);
      fd.set("quantity", "1");
      const res = await addToCart(fd);
      if (res.ok) {
        setFeedback({ kind: "ok", msg: "Adicionado ao carrinho." });
      } else {
        setFeedback({ kind: "error", msg: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="display text-[40px] text-ink">
          {showStrikethrough && (
            <span className="mr-2 text-[28px] text-ink-faint line-through">
              {formatBRL(basePrice)}
            </span>
          )}
          <span className={cn(showStrikethrough && "text-orange")}>
            {formatBRL(price)}
          </span>
        </p>
        <p className="eyebrow mt-2 text-[10px]">
          Em até 6x sem juros no cartão
        </p>
      </div>

      {colors.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-[10px]">
            Cor · <span className="text-ink">{color}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const active = c === color;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColor(c);
                    const firstSize =
                      variants.find((v) => v.color === c)?.size ?? null;
                    setSize(firstSize);
                  }}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-all",
                    active
                      ? "border-ink bg-ink text-bone"
                      : "border-line-strong text-ink-soft hover:-translate-y-0.5 hover:border-ink hover:text-ink"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizesForColor.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-[10px]">
            Tamanho · <span className="text-ink">{size ?? "—"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sizesForColor.map((v) => {
              const active = v.size === size;
              const disabled = v.stock === 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSize(v.size)}
                  className={cn(
                    "min-w-[52px] rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    active && !disabled
                      ? "border-ink bg-ink text-bone"
                      : "border-line-strong text-ink hover:-translate-y-0.5 hover:border-ink",
                    disabled &&
                      "cursor-not-allowed text-ink-faint line-through opacity-60 hover:translate-y-0 hover:border-line-strong"
                  )}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock || isPending}
        className="inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-ink"
      >
        {outOfStock
          ? "Esgotado"
          : isPending
            ? "Adicionando…"
            : "Adicionar à sacola"}
        {!outOfStock && !isPending && (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
      </button>

      {feedback && (
        <p
          className={cn(
            "text-sm",
            feedback.kind === "ok" ? "text-green" : "text-destructive"
          )}
          role="status"
        >
          {feedback.msg}
        </p>
      )}
    </div>
  );
}
