"use client";

import { useActionState, useState } from "react";
import { OrderStatus } from "@prisma/client";

import {
  cancelOrder,
  markAsDelivered,
  markAsPreparing,
  markAsShipped,
  type AdminOrderActionResult
} from "@/app/admin/pedidos/_actions";

const initial: AdminOrderActionResult = { ok: true };

export function ActionsPanel({
  number,
  status,
  carrierDefault
}: {
  number: string;
  status: OrderStatus;
  carrierDefault: string | null;
}) {
  const [prepState, prepAction, prepPending] = useActionState(
    async (_p: AdminOrderActionResult, fd: FormData) => markAsPreparing(fd),
    initial
  );
  const [shipState, shipAction, shipPending] = useActionState(
    async (_p: AdminOrderActionResult, fd: FormData) => markAsShipped(fd),
    initial
  );
  const [delivState, delivAction, delivPending] = useActionState(
    async (_p: AdminOrderActionResult, fd: FormData) => markAsDelivered(fd),
    initial
  );
  const [cancelState, cancelActionFn, cancelPending] = useActionState(
    async (_p: AdminOrderActionResult, fd: FormData) => cancelOrder(fd),
    initial
  );

  const [showCancel, setShowCancel] = useState(false);

  const canPrepare = status === "PAID";
  const canShip = status === "PAID" || status === "PREPARING";
  const canDeliver = status === "SHIPPED";
  const canCancel = !["DELIVERED", "CANCELED", "RETURNED"].includes(status);

  return (
    <div className="flex flex-col gap-4">
      {canPrepare && (
        <form action={prepAction}>
          <input type="hidden" name="number" value={number} />
          <button
            type="submit"
            disabled={prepPending}
            className="bg-orange hover:bg-orange/90 w-full rounded-md px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {prepPending ? "Atualizando…" : "Marcar em separação"}
          </button>
          {!prepState.ok && (
            <p className="text-destructive mt-2 text-xs">{prepState.error}</p>
          )}
        </form>
      )}

      {canShip && (
        <form action={shipAction} className="flex flex-col gap-2">
          <input type="hidden" name="number" value={number} />
          <p className="text-ink-soft text-xs uppercase tracking-widest">
            Enviar pedido
          </p>
          <input
            name="carrier"
            defaultValue={carrierDefault ?? ""}
            placeholder="Transportadora (ex.: Correios)"
            required
            className="border-line-strong bg-surface focus-visible:ring-orange h-9 rounded-md border px-3 text-sm focus-visible:outline-none focus-visible:ring-2"
          />
          <input
            name="trackingCode"
            placeholder="Código de rastreio"
            required
            className="border-line-strong bg-surface focus-visible:ring-orange h-9 rounded-md border px-3 text-sm focus-visible:outline-none focus-visible:ring-2"
          />
          <button
            type="submit"
            disabled={shipPending}
            className="bg-orange hover:bg-orange/90 mt-1 rounded-md px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {shipPending ? "Enviando…" : "Confirmar envio"}
          </button>
          {!shipState.ok && (
            <p className="text-destructive text-xs">{shipState.error}</p>
          )}
        </form>
      )}

      {canDeliver && (
        <form action={delivAction}>
          <input type="hidden" name="number" value={number} />
          <button
            type="submit"
            disabled={delivPending}
            className="bg-ink hover:bg-ink-soft w-full rounded-md px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {delivPending ? "Atualizando…" : "Marcar como entregue"}
          </button>
          {!delivState.ok && (
            <p className="text-destructive mt-2 text-xs">{delivState.error}</p>
          )}
        </form>
      )}

      {canCancel && (
        <div className="border-line border-t pt-4">
          {!showCancel ? (
            <button
              type="button"
              onClick={() => setShowCancel(true)}
              className="text-ink-soft hover:text-destructive text-xs underline-offset-4 hover:underline"
            >
              Cancelar pedido
            </button>
          ) : (
            <form action={cancelActionFn} className="flex flex-col gap-2">
              <input type="hidden" name="number" value={number} />
              <p className="text-ink-soft text-xs uppercase tracking-widest">
                Cancelar pedido
              </p>
              <textarea
                name="reason"
                rows={2}
                required
                placeholder="Motivo (visível na timeline)"
                className="border-line-strong bg-surface focus-visible:ring-orange rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
              />
              {status !== "SHIPPED" && (
                <p className="text-ink-faint text-xs">
                  O estoque dos itens será devolvido automaticamente.
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={cancelPending}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {cancelPending ? "Cancelando…" : "Confirmar cancelamento"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancel(false)}
                  className="border-line text-ink-soft hover:text-ink rounded-md border px-4 py-2 text-sm"
                >
                  Voltar
                </button>
              </div>
              {!cancelState.ok && (
                <p className="text-destructive text-xs">{cancelState.error}</p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
