"use client";

import Link from "next/link";
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

const SWATCH_MAP: Record<string, string> = {
  laranja: "#FF7A00",
  verde: "#6FBF4A",
  "verde militar": "#7A8C5A",
  "verde água": "#7BD4C4",
  "verde-musgo": "#7A8C5A",
  areia: "#F5E9DA",
  branco: "#FAF7F2",
  "off-white": "#F5F2EC",
  preto: "#1A1614",
  marinho: "#1F3661",
  azul: "#5DC1B5",
  rosa: "#FF8DA1",
  pink: "#FF1F7A",
  coral: "#FF6B47",
  natural: "#D4C7B0",
  terracota: "#C76B4A",
  olive: "#7A8C5A",
  "preto floral": "#1A1614",
  "floral preto": "#1A1614",
  floral: "#E91E63",
  "floral rosa": "#E91E63",
  "pink amarelo": "#FF1F7A"
};

function swatchColor(name: string) {
  return SWATCH_MAP[name.toLowerCase().trim()] ?? "#D4C7B0";
}

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

  const sizesForColor = useMemo(
    () =>
      variants
        .filter((v) => (color ? v.color === color : true))
        .filter((v) => v.size != null),
    [variants, color]
  );

  const initialSize = sizesForColor[0]?.size ?? null;
  const [size, setSize] = useState<string | null>(initialSize);
  const [qty, setQty] = useState(1);

  const selected = useMemo(
    () =>
      variants.find((v) => v.color === color && v.size === size) ??
      variants.find((v) => (color ? v.color === color : true)) ??
      null,
    [variants, color, size]
  );

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
      let added = 0;
      let lastError: string | null = null;
      for (let i = 0; i < qty; i++) {
        const fd = new FormData();
        fd.set("variantId", selected.id);
        fd.set("quantity", "1");
        const res = await addToCart(fd);
        if (res.ok) {
          added += 1;
        } else {
          lastError = res.error;
          break;
        }
      }
      if (added === qty) {
        setFeedback({
          kind: "ok",
          msg:
            qty === 1
              ? "Adicionado à sacola."
              : `${qty} peças adicionadas à sacola.`
        });
      } else if (lastError) {
        setFeedback({ kind: "error", msg: lastError });
      }
    });
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Preço + parcelas */}
      <div className="flex items-baseline gap-5">
        <p className="display text-[clamp(28px,3vw,32px)] text-ink">
          {showStrikethrough && (
            <span className="mr-2 text-[24px] text-ink-faint line-through">
              {formatBRL(basePrice)}
            </span>
          )}
          <span className={cn(showStrikethrough && "text-orange")}>
            {formatBRL(price)}
          </span>
        </p>
        <p className="eyebrow text-[10px]">
          ou 6x de {formatBRL(price / 6)}
        </p>
      </div>

      {/* Highlights chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { icon: "sun" as const, label: "FPU 50+" },
          { icon: "leaf" as const, label: "Respirável" },
          { icon: "drop" as const, label: "Seca rápido" }
        ].map((h) => (
          <span
            key={h.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-[12px] font-semibold text-ink"
          >
            <HighlightIcon name={h.icon} />
            {h.label}
          </span>
        ))}
      </div>

      {colors.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="eyebrow">Cor</span>
            <span className="text-[13px] font-semibold text-ink">{color}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
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
                  title={c}
                  aria-label={c}
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-full border transition-all",
                    active
                      ? "border-2 border-ink ring-2 ring-orange ring-offset-2 ring-offset-bone"
                      : "border-line-strong hover:border-ink"
                  )}
                  style={{ background: swatchColor(c) }}
                />
              );
            })}
          </div>
        </div>
      )}

      {sizesForColor.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="eyebrow">Tamanho</span>
            <Link
              href="/ajuda/tamanhos"
              className="text-[12px] underline underline-offset-4 hover:text-orange"
            >
              Guia de medidas
            </Link>
          </div>
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
                    "min-w-[52px] border px-3.5 py-3 text-[13px] font-semibold transition-all",
                    active && !disabled
                      ? "border-ink bg-ink text-bone"
                      : "border-line-strong text-ink hover:border-ink",
                    disabled &&
                      "cursor-not-allowed text-ink-faint line-through opacity-60 hover:border-line-strong"
                  )}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Qty + Add */}
      <div className="flex flex-wrap gap-3">
        <div className="inline-flex items-center rounded-full border border-line-strong p-1">
          <button
            type="button"
            aria-label="Diminuir"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="px-3 py-2 text-ink hover:text-orange"
          >
            <Minus />
          </button>
          <span className="px-3 text-[14px] font-bold">{qty}</span>
          <button
            type="button"
            aria-label="Aumentar"
            onClick={() => setQty(qty + 1)}
            className="px-3 py-2 text-ink hover:text-orange"
          >
            <Plus />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock || isPending}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2.5 rounded-full px-7 py-4 text-sm font-semibold text-bone transition-all",
            feedback?.kind === "ok" ? "bg-green" : "bg-ink hover:bg-orange",
            !outOfStock && !isPending && "hover:-translate-y-0.5",
            (outOfStock || isPending) &&
              "cursor-not-allowed opacity-50 hover:translate-y-0 hover:bg-ink"
          )}
        >
          {outOfStock
            ? "Esgotado"
            : isPending
              ? "Adicionando…"
              : feedback?.kind === "ok"
                ? "Adicionado ✓"
                : "Adicionar à sacola"}
          {!outOfStock && !isPending && feedback?.kind !== "ok" && (
            <ArrowRight />
          )}
        </button>
      </div>

      {feedback && feedback.kind === "error" && (
        <p role="status" className="text-sm text-destructive">
          {feedback.msg}
        </p>
      )}

      {/* Service strip */}
      <div className="grid grid-cols-2 gap-3 border-y border-line py-4 text-[12px] text-ink-soft">
        <div className="flex items-center gap-2">
          <span aria-hidden>📦</span> Frete grátis acima de R$ 399
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden>↺</span> Trocas em até 30 dias
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden>🔒</span> Pagamento seguro
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden>🇧🇷</span> Feito no Brasil
        </div>
      </div>
    </div>
  );
}

function HighlightIcon({ name }: { name: "sun" | "leaf" | "drop" }) {
  const props = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  if (name === "sun")
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
      </svg>
    );
  if (name === "leaf")
    return (
      <svg {...props}>
        <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14z" />
        <path d="M5 19c2-4 5-7 9-9" />
      </svg>
    );
  return (
    <svg {...props}>
      <path d="M12 3s6 7 6 12a6 6 0 01-12 0c0-5 6-12 6-12z" />
    </svg>
  );
}

function Minus() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}
function Plus() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
