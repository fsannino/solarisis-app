"use client";

import { useActionState, useEffect, useRef } from "react";

import { createVariant, type VariantFormState } from "./_variants-actions";

export function NewVariantRow({ productId }: { productId: string }) {
  const create = createVariant.bind(null, productId);
  const [state, action, pending] = useActionState<VariantFormState | undefined, FormData>(
    create,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa o form depois de criar com sucesso.
  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="space-y-1">
      <form
        ref={formRef}
        action={action}
        className="grid grid-cols-2 items-center gap-2 md:grid-cols-[1fr_1fr_1.4fr_1fr_0.8fr_0.8fr_auto]"
      >
        <input name="color" type="text" placeholder="Cor (ex: Areia)" className={inputClass} />
        <input
          name="size"
          type="text"
          placeholder="Tamanho (ex: M)"
          className={inputClass}
        />
        <input
          name="sku"
          type="text"
          required
          placeholder="SKU (ex: SOL-CAM-AR-M)"
          className={`${inputClass} font-mono text-xs`}
        />
        <input
          name="priceOverride"
          type="text"
          inputMode="decimal"
          placeholder="Preço (opcional)"
          className={inputClass}
        />
        <input
          name="stock"
          type="number"
          min={0}
          defaultValue={0}
          className={inputClass}
        />
        <input
          name="weight"
          type="number"
          min={0}
          placeholder="Peso (g)"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-orange rounded-md px-3 py-1.5 text-xs font-medium text-white transition disabled:opacity-50"
        >
          {pending ? "…" : "Adicionar"}
        </button>
      </form>
      {state && !state.ok ? (
        <p className="px-2 text-xs text-red-700">{state.error}</p>
      ) : null}
    </div>
  );
}

const inputClass =
  "border-line focus:border-orange w-full rounded-md border bg-white px-2 py-1.5 text-sm outline-none";
