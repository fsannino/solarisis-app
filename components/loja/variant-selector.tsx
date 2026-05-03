"use client";

import { useMemo, useState, useTransition } from "react";
import { addToCart } from "@/app/(loja)/_actions";
import { Button } from "@/components/ui/button";
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
      variants.find(
        (v) => v.color === color && v.size === size
      ) ??
      variants.find((v) => (color ? v.color === color : true)) ??
      null
    );
  }, [variants, color, size]);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "error";
    msg: string;
  } | null>(null);

  const price =
    selected?.priceOverride ?? salePrice ?? basePrice;
  const showStrikethrough =
    salePrice != null && salePrice < basePrice && selected?.priceOverride == null;
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
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-serif text-3xl text-ink">
          {showStrikethrough && (
            <span className="text-ink-faint line-through mr-2 text-2xl">
              {formatBRL(basePrice)}
            </span>
          )}
          <span className={cn(showStrikethrough && "text-orange")}>
            {formatBRL(price)}
          </span>
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          Em até 6x sem juros no cartão.
        </p>
      </div>

      {colors.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-ink-soft">
            Cor: <span className="text-ink">{color}</span>
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
                    const firstSize = variants.find((v) => v.color === c)?.size ?? null;
                    setSize(firstSize);
                  }}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm transition-colors",
                    active
                      ? "border-orange bg-orange-soft text-ink"
                      : "border-line-strong text-ink-soft hover:border-orange hover:text-ink"
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
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-ink-soft">
            Tamanho: <span className="text-ink">{size ?? "—"}</span>
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
                    "min-w-[3rem] rounded-md border px-3 py-2 text-sm transition-colors",
                    active && !disabled
                      ? "border-orange bg-orange-soft text-ink"
                      : "border-line-strong text-ink hover:border-orange",
                    disabled && "cursor-not-allowed text-ink-faint line-through opacity-60"
                  )}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button
        size="lg"
        type="button"
        onClick={handleAdd}
        disabled={outOfStock || isPending}
      >
        {outOfStock
          ? "Esgotado"
          : isPending
            ? "Adicionando..."
            : "Adicionar ao carrinho"}
      </Button>

      {feedback && (
        <p
          className={cn(
            "text-sm",
            feedback.kind === "ok" ? "text-ink-soft" : "text-destructive"
          )}
          role="status"
        >
          {feedback.msg}
        </p>
      )}
    </div>
  );
}
