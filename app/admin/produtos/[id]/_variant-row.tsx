"use client";

import { useActionState, useTransition } from "react";

import {
  deleteVariant,
  updateVariant,
  type VariantFormState
} from "./_variants-actions";

type VariantValues = {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  priceOverride: string | null;
  stock: number;
  weight: number | null;
};

export function VariantRow({ variant }: { variant: VariantValues }) {
  const update = updateVariant.bind(null, variant.id);
  const [state, action, pending] = useActionState<VariantFormState | undefined, FormData>(
    update,
    undefined
  );

  return (
    <div className="space-y-1">
      <form
        action={action}
        className="grid grid-cols-2 items-center gap-2 md:grid-cols-[1fr_1fr_1.4fr_1fr_0.8fr_0.8fr_auto]"
      >
        <input
          name="color"
          type="text"
          defaultValue={variant.color ?? ""}
          placeholder="Cor"
          className={inputClass}
        />
        <input
          name="size"
          type="text"
          defaultValue={variant.size ?? ""}
          placeholder="Tamanho"
          className={inputClass}
        />
        <input
          name="sku"
          type="text"
          required
          defaultValue={variant.sku}
          placeholder="SKU"
          className={`${inputClass} font-mono text-xs`}
        />
        <input
          name="priceOverride"
          type="text"
          inputMode="decimal"
          defaultValue={variant.priceOverride ?? ""}
          placeholder="—"
          className={inputClass}
        />
        <input
          name="stock"
          type="number"
          min={0}
          defaultValue={variant.stock}
          className={inputClass}
        />
        <input
          name="weight"
          type="number"
          min={0}
          defaultValue={variant.weight ?? ""}
          placeholder="—"
          className={inputClass}
        />
        <div className="flex gap-1">
          <button
            type="submit"
            disabled={pending}
            className="border-line text-ink-soft hover:border-line-strong hover:text-ink rounded-md border px-2 py-1.5 text-xs transition disabled:opacity-50"
          >
            {pending ? "…" : "Salvar"}
          </button>
          <DeleteButton variantId={variant.id} />
        </div>
      </form>
      {state && !state.ok ? (
        <p className="px-2 text-xs text-red-700">{state.error}</p>
      ) : null}
      {state && state.ok ? (
        <p className="px-2 text-xs text-green-700">Atualizado.</p>
      ) : null}
    </div>
  );
}

function DeleteButton({ variantId }: { variantId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Remover esta variante?")) return;
    startTransition(async () => {
      const res = await deleteVariant(variantId);
      if (!res.ok) alert(res.error);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="border-line text-ink-faint hover:border-line-strong hover:text-ink rounded-md border px-2 py-1.5 text-xs transition disabled:opacity-50"
    >
      {pending ? "…" : "✕"}
    </button>
  );
}

const inputClass =
  "border-line focus:border-orange w-full rounded-md border bg-white px-2 py-1.5 text-sm outline-none";
