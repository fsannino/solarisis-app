"use client";

import { useActionState, useState } from "react";

import type { ReturnFormState } from "../_actions";
import { formatBRL } from "@/lib/utils";

type OrderItem = {
  id: string;
  productName: string;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
};

type Props = {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  action: (
    prev: ReturnFormState | undefined,
    formData: FormData
  ) => Promise<ReturnFormState>;
};

type RowState = {
  selected: boolean;
  qty: number;
  condition: "new" | "used" | "damaged";
};

export function ItemsForm({ orderId, orderNumber, items, action }: Props) {
  const [state, formAction, pending] = useActionState<
    ReturnFormState | undefined,
    FormData
  >(action, undefined);

  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const o: Record<string, RowState> = {};
    for (const it of items) {
      o[it.id] = { selected: false, qty: 1, condition: "new" };
    }
    return o;
  });

  function update(id: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  const selectedRows = items.filter((it) => rows[it.id]?.selected);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="orderId" value={orderId} />
      {selectedRows.map((it) => (
        <input
          key={it.id}
          type="hidden"
          name="items"
          value={JSON.stringify({
            orderItemId: it.id,
            qty: rows[it.id].qty,
            condition: rows[it.id].condition
          })}
        />
      ))}

      {state && !state.ok && state.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <section className="rounded-lg border border-line bg-surface">
        <header className="border-b border-line px-5 py-4">
          <p className="eyebrow">Itens do pedido #{orderNumber}</p>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            Marque os itens que serão devolvidos e ajuste a quantidade e
            condição.
          </p>
        </header>
        <ul>
          {items.map((it, i) => {
            const row = rows[it.id];
            return (
              <li
                key={it.id}
                className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-5 ${
                  i < items.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <label className="flex flex-1 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={(e) =>
                      update(it.id, { selected: e.target.checked })
                    }
                    className="mt-1 h-4 w-4 accent-orange"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-ink">
                      {it.productName}
                    </span>
                    {it.variantLabel && (
                      <span className="block text-[11px] text-ink-faint">
                        {it.variantLabel}
                      </span>
                    )}
                    <span className="mt-0.5 block text-[11px] text-ink-soft">
                      Comprado: {it.quantity} × {formatBRL(it.unitPrice)}
                    </span>
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                    Qtd
                    <input
                      type="number"
                      min={1}
                      max={it.quantity}
                      value={row.qty}
                      disabled={!row.selected}
                      onChange={(e) =>
                        update(it.id, {
                          qty: Math.max(
                            1,
                            Math.min(it.quantity, Number(e.target.value) || 1)
                          )
                        })
                      }
                      className="h-9 w-16 rounded-md border border-line bg-bone px-2 text-[13px] text-ink focus-visible:border-ink focus-visible:outline-none disabled:opacity-50"
                    />
                  </label>
                  <select
                    value={row.condition}
                    disabled={!row.selected}
                    onChange={(e) =>
                      update(it.id, {
                        condition: e.target.value as RowState["condition"]
                      })
                    }
                    className="h-9 rounded-md border border-line bg-bone px-2 text-[13px] text-ink focus-visible:border-ink focus-visible:outline-none disabled:opacity-50"
                  >
                    <option value="new">Novo / sem uso</option>
                    <option value="used">Usado</option>
                    <option value="damaged">Avariado</option>
                  </select>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <p className="eyebrow mb-4">Motivo</p>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="text-[13px] font-medium text-ink">
              Motivo principal
            </span>
            <select
              name="reason"
              required
              defaultValue="Tamanho não serviu"
              className="mt-1.5 w-full rounded-md border border-line bg-bone px-3 py-2 text-[13px] text-ink focus-visible:border-ink focus-visible:outline-none"
            >
              <option>Tamanho não serviu</option>
              <option>Defeito de fabricação</option>
              <option>Produto diferente do anunciado</option>
              <option>Arrependimento (até 7 dias)</option>
              <option>Cor diferente do esperado</option>
              <option>Outro</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[13px] font-medium text-ink">
              Detalhes (opcional)
            </span>
            <textarea
              name="reasonDetail"
              rows={3}
              className="mt-1.5 w-full rounded-md border border-line bg-bone px-3 py-2 text-[13px] text-ink focus-visible:border-ink focus-visible:outline-none"
              placeholder="Notas internas, contato com a cliente, etc."
            />
          </label>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-ink-soft">
          {selectedRows.length}{" "}
          {selectedRows.length === 1 ? "item selecionado" : "itens selecionados"}
        </p>
        <button
          type="submit"
          disabled={pending || selectedRows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-3 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-ink"
        >
          {pending ? "Registrando…" : "Registrar devolução"}
        </button>
      </div>
    </form>
  );
}
