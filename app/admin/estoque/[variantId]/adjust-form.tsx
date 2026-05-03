"use client";

import { useActionState, useState } from "react";

import { adjustStock, type StockAdjustResult } from "../_actions";

type Preset =
  | { label: string; delta: number }
  | { label: string; abs: number };

const PRESETS: Preset[] = [
  { label: "+10", delta: 10 },
  { label: "+5", delta: 5 },
  { label: "+1", delta: 1 },
  { label: "−1", delta: -1 },
  { label: "−5", delta: -5 },
  { label: "Zerar", abs: 0 }
];

export function AdjustForm({
  variantId,
  currentStock
}: {
  variantId: string;
  currentStock: number;
}) {
  const [state, formAction, pending] = useActionState<
    StockAdjustResult | undefined,
    FormData
  >(async (_prev, fd) => adjustStock(fd), undefined);

  const [target, setTarget] = useState(currentStock);

  function applyPreset(p: Preset) {
    if ("abs" in p) {
      setTarget(p.abs);
    } else {
      setTarget((prev) => Math.max(0, prev + p.delta));
    }
  }

  const delta = target - currentStock;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="variantId" value={variantId} />

      <div>
        <label className="eyebrow text-[10px]">Novo estoque</label>
        <div className="mt-2 flex items-baseline gap-3">
          <input
            name="newStock"
            type="number"
            min={0}
            max={99999}
            required
            value={target}
            onChange={(e) => setTarget(Math.max(0, Number(e.target.value)))}
            className="w-32 rounded-md border border-line-strong bg-bone px-3 py-2 font-serif text-[24px] font-medium text-ink focus-visible:border-ink focus-visible:outline-none"
          />
          <span className="text-[12px] text-ink-faint">unidades</span>
          {delta !== 0 && (
            <span
              className={`font-mono text-[11px] font-semibold ${
                delta > 0 ? "text-green" : "text-destructive"
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p)}
            className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] font-semibold text-ink-soft hover:border-ink hover:text-ink"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div>
        <label className="eyebrow text-[10px]">Motivo</label>
        <input
          name="reason"
          type="text"
          required
          maxLength={280}
          placeholder="Ex: recebimento de fornecedor, perda, contagem..."
          className="mt-2 w-full rounded-md border border-line bg-bone px-3 py-2 text-[13px] text-ink placeholder:text-ink-faint focus-visible:border-ink focus-visible:outline-none"
        />
      </div>

      {state && !state.ok && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-[12px] text-destructive">
          {state.error}
        </p>
      )}
      {state && state.ok && (
        <p className="rounded-md border border-orange/30 bg-orange-soft px-4 py-2 text-[12px] text-ink">
          Estoque atualizado: {state.newStock} un.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || delta === 0}
        className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-ink px-6 py-3 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-ink"
      >
        {pending ? "Salvando…" : delta === 0 ? "Sem alteração" : "Salvar ajuste"}
      </button>
    </form>
  );
}
