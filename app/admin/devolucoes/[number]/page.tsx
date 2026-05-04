import Link from "next/link";
import { notFound } from "next/navigation";
import { ReturnStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

import {
  approveReturn,
  markReceived,
  markRefunded,
  rejectReturn
} from "../_actions";

type PageProps = { params: Promise<{ number: string }> };

const STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "Solicitada",
  APPROVED: "Aprovada",
  RECEIVED: "Recebida",
  REFUNDED: "Reembolsada",
  REJECTED: "Recusada"
};

const REFUND_METHOD_LABEL: Record<string, string> = {
  pix: "Pix",
  estorno_cartao: "Estorno no cartão",
  credito_loja: "Crédito na loja"
};

type ReturnItem = {
  orderItemId: string;
  qty: number;
  condition: "new" | "used" | "damaged";
};

const CONDITION_LABEL: Record<string, string> = {
  new: "Novo / sem uso",
  used: "Usado",
  damaged: "Avariado"
};

export default async function ReturnDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { number } = await params;

  const ret = await prisma.return.findUnique({
    where: { number },
    include: {
      order: {
        select: {
          id: true,
          number: true,
          total: true,
          paymentMethod: true,
          paymentStatus: true,
          items: {
            select: {
              id: true,
              productName: true,
              variantLabel: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true
            }
          }
        }
      },
      customer: { select: { name: true, email: true } }
    }
  });
  if (!ret) notFound();

  const items = (ret.items as unknown as ReturnItem[]) ?? [];

  async function handleApprove(fd: FormData) {
    "use server";
    await approveReturn(fd);
  }
  async function handleReject(fd: FormData) {
    "use server";
    await rejectReturn(fd);
  }
  async function handleReceive(fd: FormData) {
    "use server";
    await markReceived(fd);
  }
  async function handleRefund(fd: FormData) {
    "use server";
    await markRefunded(fd);
  }
  const orderItemMap = Object.fromEntries(
    ret.order.items.map((i) => [i.id, i])
  );

  const suggestedRefund = items.reduce((sum, ri) => {
    const oi = orderItemMap[ri.orderItemId];
    if (!oi) return sum;
    const unit = oi.unitPrice.toNumber();
    return sum + unit * ri.qty;
  }, 0);

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-7">
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/devolucoes"
            className="inline-flex items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
          >
            ← Devoluções
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="display text-[clamp(28px,3vw,36px)]">
              {ret.number}
            </h1>
            <StatusPill status={ret.status} />
          </div>
          <p className="font-mono text-[11px] text-ink-soft">
            Pedido #{ret.order.number} · {ret.customer.name} ·{" "}
            {ret.createdAt.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>
        <Link
          href={`/admin/pedidos/${ret.order.number}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-[12px] font-medium text-ink hover:border-ink hover:bg-ink hover:text-bone"
        >
          Ver pedido
        </Link>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Itens da devolução */}
        <section className="rounded-lg border border-line bg-surface">
          <header className="border-b border-line px-5 py-4">
            <p className="eyebrow">Itens devolvidos</p>
            <p className="mt-1.5 text-[13px] text-ink-soft">
              {items.length} {items.length === 1 ? "item" : "itens"}
            </p>
          </header>
          <ul>
            {items.map((ri, i) => {
              const oi = orderItemMap[ri.orderItemId];
              if (!oi) return null;
              const unit = oi.unitPrice.toNumber();
              return (
                <li
                  key={ri.orderItemId}
                  className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${
                    i < items.length - 1 ? "border-b border-line" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">
                      {oi.productName}
                    </p>
                    {oi.variantLabel && (
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        {oi.variantLabel}
                      </p>
                    )}
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-soft">
                      Condição: {CONDITION_LABEL[ri.condition] ?? ri.condition}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] text-ink-soft">
                      {ri.qty} × {formatBRL(unit)}
                    </p>
                    <p className="font-serif text-[14px] font-medium text-ink">
                      {formatBRL(unit * ri.qty)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-line bg-bone px-5 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-ink-soft">
              Reembolso sugerido
            </span>
            <span className="font-serif text-[18px] font-medium text-ink">
              {formatBRL(suggestedRefund)}
            </span>
          </div>
        </section>

        {/* Sidebar: status + ações */}
        <div className="flex flex-col gap-5">
          <section className="rounded-lg border border-line bg-surface p-5">
            <p className="eyebrow mb-3">Motivo</p>
            <p className="text-[13px] font-medium text-ink">{ret.reason}</p>
            {ret.reasonDetail && (
              <p className="mt-2 whitespace-pre-line text-[13px] text-ink-soft">
                {ret.reasonDetail}
              </p>
            )}
          </section>

          {ret.status === "REFUNDED" && ret.refundAmount && (
            <section className="rounded-lg border border-line bg-surface p-5">
              <p className="eyebrow mb-3">Reembolso</p>
              <p className="font-serif text-[24px] font-medium text-green">
                {formatBRL(ret.refundAmount.toNumber())}
              </p>
              {ret.refundMethod && (
                <p className="mt-1 text-[12px] text-ink-soft">
                  via{" "}
                  {REFUND_METHOD_LABEL[ret.refundMethod] ?? ret.refundMethod}
                </p>
              )}
            </section>
          )}

          {/* Próxima ação */}
          {ret.status === "REQUESTED" && (
            <section className="rounded-lg border border-line bg-surface p-5">
              <p className="eyebrow mb-3">Decisão</p>
              <p className="text-[13px] text-ink-soft">
                Aprove pra agendar a coleta com a transportadora ou recuse com
                justificativa por outro canal.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={handleApprove}>
                  <input type="hidden" name="number" value={ret.number} />
                  <button
                    type="submit"
                    className="rounded-full bg-ink px-4 py-2 text-[12px] font-semibold text-bone hover:bg-orange"
                  >
                    Aprovar
                  </button>
                </form>
                <form action={handleReject}>
                  <input type="hidden" name="number" value={ret.number} />
                  <button
                    type="submit"
                    className="rounded-full border border-destructive/40 px-4 py-2 text-[12px] font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Recusar
                  </button>
                </form>
              </div>
            </section>
          )}

          {ret.status === "APPROVED" && (
            <section className="rounded-lg border border-line bg-surface p-5">
              <p className="eyebrow mb-3">Recebimento</p>
              <p className="text-[13px] text-ink-soft">
                Quando os itens chegarem ao galpão e forem inspecionados, marque
                como recebida pra liberar o reembolso.
              </p>
              <form action={handleReceive} className="mt-4">
                <input type="hidden" name="number" value={ret.number} />
                <button
                  type="submit"
                  className="rounded-full bg-ink px-4 py-2 text-[12px] font-semibold text-bone hover:bg-orange"
                >
                  Marcar como recebida
                </button>
              </form>
            </section>
          )}

          {ret.status === "RECEIVED" && (
            <section className="rounded-lg border border-line bg-surface p-5">
              <p className="eyebrow mb-3">Reembolsar</p>
              <form
                action={handleRefund}
                className="mt-1 flex flex-col gap-3"
              >
                <input type="hidden" name="number" value={ret.number} />
                <label className="block">
                  <span className="text-[13px] font-medium text-ink">
                    Valor (R$)
                  </span>
                  <input
                    name="refundAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={suggestedRefund.toFixed(2)}
                    className="mt-1.5 w-full rounded-md border border-line bg-bone px-3 py-2 text-[13px] text-ink focus-visible:border-ink focus-visible:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-medium text-ink">
                    Método
                  </span>
                  <select
                    name="refundMethod"
                    required
                    defaultValue="pix"
                    className="mt-1.5 w-full rounded-md border border-line bg-bone px-3 py-2 text-[13px] text-ink focus-visible:border-ink focus-visible:outline-none"
                  >
                    <option value="pix">Pix</option>
                    <option value="estorno_cartao">Estorno no cartão</option>
                    <option value="credito_loja">Crédito na loja</option>
                  </select>
                </label>
                <button
                  type="submit"
                  className="self-start rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-bone hover:bg-orange"
                >
                  Confirmar reembolso
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ReturnStatus }) {
  const tones: Record<ReturnStatus, string> = {
    REQUESTED: "bg-orange-soft text-orange",
    APPROVED: "bg-orange-soft text-orange",
    RECEIVED: "bg-orange-soft text-orange",
    REFUNDED: "bg-green/20 text-green",
    REJECTED: "bg-line text-ink-faint"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
