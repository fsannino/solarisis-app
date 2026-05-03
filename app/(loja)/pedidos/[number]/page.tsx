import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  BOLETO: "Boleto",
  DEBIT_CARD: "Cartão de débito"
};

const STATUS_COPY: Record<
  string,
  { title: string; body: string; tone: "soft" | "muted" }
> = {
  PENDING: {
    title: "Aguardando pagamento",
    body: "Quando o pagamento for confirmado, você recebe um e-mail e o pedido entra em separação.",
    tone: "soft"
  },
  PAID: {
    title: "Pagamento confirmado",
    body: "Estamos preparando seu pedido pra envio.",
    tone: "soft"
  },
  PREPARING: {
    title: "Em separação",
    body: "Seu pedido está sendo embalado.",
    tone: "soft"
  },
  SHIPPED: {
    title: "Enviado",
    body: "Seu pedido saiu pra entrega.",
    tone: "soft"
  },
  DELIVERED: {
    title: "Entregue",
    body: "Esperamos que você ame.",
    tone: "soft"
  },
  CANCELED: {
    title: "Cancelado",
    body: "Esse pedido foi cancelado.",
    tone: "muted"
  }
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  return { title: `Pedido ${number} — Solarisis` };
}

export default async function OrderConfirmationPage({
  params,
  searchParams
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { number } = await params;
  const { status: backStatus } = await searchParams;
  const session = await requireCustomer(`/pedidos/${number}`);

  const order = await prisma.order.findUnique({
    where: { number },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { images: { where: { isPrimary: true }, take: 1 } }
              }
            }
          }
        }
      }
    }
  });

  if (!order || order.customerId !== session.user.id) {
    notFound();
  }

  const ship = order.shippingAddress as Record<string, string | null>;
  const status = STATUS_COPY[order.status] ?? STATUS_COPY.PENDING;
  const paymentDetails = (order.paymentDetails ?? {}) as {
    initPoint?: string;
  };
  const initPoint = paymentDetails.initPoint;
  const showPayCta =
    order.paymentStatus === "PENDING" && order.status === "PENDING" && !!initPoint;

  const backBanner =
    backStatus === "approved"
      ? {
          tone: "ok" as const,
          msg: "Pagamento recebido. Estamos confirmando os detalhes — pode ficar tranquilo."
        }
      : backStatus === "pending"
        ? {
            tone: "info" as const,
            msg: "Pagamento em processamento. Você recebe a confirmação por e-mail assim que for aprovado."
          }
        : backStatus === "rejected"
          ? {
              tone: "error" as const,
              msg: "Não conseguimos aprovar o pagamento. Você pode tentar de novo abaixo."
            }
          : null;

  const tonePill =
    status.tone === "muted"
      ? "bg-ink/10 text-ink-soft"
      : "bg-orange-soft text-orange";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-20">
      {backBanner && (
        <div
          className={
            backBanner.tone === "ok"
              ? "mb-6 border border-orange/30 bg-orange-soft px-5 py-4 text-sm text-ink"
              : backBanner.tone === "error"
                ? "mb-6 border border-destructive/40 bg-destructive/10 px-5 py-4 text-sm text-destructive"
                : "mb-6 border border-line bg-surface px-5 py-4 text-sm text-ink-soft"
          }
          role="status"
        >
          {backBanner.msg}
        </div>
      )}
      <div className="border border-line bg-surface p-8 md:p-12">
        <span
          className={`inline-block rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${tonePill}`}
        >
          {status.title}
        </span>
        <h1 className="display mt-5 text-[clamp(36px,4.5vw,56px)]">
          Obrigado,{" "}
          <em className="not-italic italic text-orange">
            {session.user.name?.split(" ")[0]}
          </em>
          .
        </h1>
        <p className="mt-4 text-[15px] leading-[1.55] text-ink-soft">
          {status.body}
        </p>
        <div className="mt-7 grid grid-cols-2 gap-4 text-[14px]">
          <div>
            <p className="eyebrow text-[10px]">Número do pedido</p>
            <p className="mt-1.5 font-mono text-ink">#{order.number}</p>
          </div>
          <div>
            <p className="eyebrow text-[10px]">Pagamento</p>
            <p className="mt-1.5 text-ink">
              {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-6 border border-line bg-surface p-6 md:p-8">
        <p className="eyebrow">Itens</p>
        <ul className="mt-4 flex flex-col divide-y divide-line">
          {order.items.map((it) => {
            const image = it.variant.product.images[0];
            return (
              <li key={it.id} className="flex gap-4 py-4 first:pt-0">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-sand">
                  {image && (
                    <Image
                      src={image.url}
                      alt={image.alt ?? it.productName}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col text-sm">
                  <Link
                    href={`/produtos/${it.variant.product.slug}`}
                    className="font-serif text-[16px] font-medium text-ink hover:text-orange"
                  >
                    {it.productName}
                  </Link>
                  {it.variantLabel && (
                    <p className="eyebrow mt-1 text-[10px]">{it.variantLabel}</p>
                  )}
                  <p className="mt-1 text-xs text-ink-faint">
                    {it.quantity} × {formatBRL(it.unitPrice.toNumber())}
                  </p>
                </div>
                <p className="font-serif text-[15px] font-medium text-ink">
                  {formatBRL(it.totalPrice.toNumber())}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span className="text-ink">
              {formatBRL(order.subtotal.toNumber())}
            </span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>Frete</span>
            <span className="text-ink">
              {order.shippingCost.toNumber() === 0
                ? "Grátis"
                : formatBRL(order.shippingCost.toNumber())}
            </span>
          </div>
          {order.discount.toNumber() > 0 && (
            <div className="flex justify-between text-ink-soft">
              <span>Desconto</span>
              <span className="text-ink">
                − {formatBRL(order.discount.toNumber())}
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-5">
          <span className="font-serif text-[16px] italic text-ink-soft">
            Total
          </span>
          <span className="display text-[28px]">
            {formatBRL(order.total.toNumber())}
          </span>
        </div>
      </section>

      {order.nfeUrl && (
        <section className="mt-6 border border-line bg-surface p-6 md:p-8">
          <p className="eyebrow">Nota fiscal</p>
          <p className="mt-2 text-[14px] text-ink">
            {order.nfeNumber ? (
              <>
                NF-e <strong>#{order.nfeNumber}</strong> · autorizada pela SEFAZ.
              </>
            ) : (
              "NF-e disponível pra download."
            )}
          </p>
          <a
            href={order.nfeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-[13px] font-semibold text-orange underline-offset-4 hover:underline"
          >
            Baixar PDF →
          </a>
        </section>
      )}

      <section className="mt-6 grid gap-6 border border-line bg-surface p-6 md:grid-cols-2 md:p-8">
        <div>
          <p className="eyebrow">Entrega</p>
          <p className="mt-3 text-[14px] leading-[1.55] text-ink">
            {ship.recipient}
            <br />
            {ship.street}, {ship.number}
            {ship.complement ? ` · ${ship.complement}` : ""}
            <br />
            {ship.district} · {ship.city}/{ship.state}
            <br />
            CEP {ship.cep}
          </p>
        </div>
        <div>
          <p className="eyebrow">Próximos passos</p>
          <p className="mt-3 text-[14px] leading-[1.55] text-ink-soft">
            {showPayCta
              ? "Conclua o pagamento pra a gente começar a separar seu pedido."
              : order.paymentStatus === "PAID"
                ? "Pagamento confirmado. A nota fiscal sai junto com o envio."
                : "Assim que o pagamento for confirmado pelo Mercado Pago, atualizamos esse status automaticamente."}
          </p>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        {showPayCta && (
          <a
            href={initPoint!}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-orange px-7 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-ink"
          >
            Pagar com Mercado Pago
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        )}
        <Link
          href="/loja"
          className={`inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
            showPayCta
              ? "border border-line-strong text-ink hover:border-ink hover:bg-ink hover:text-bone"
              : "bg-ink text-bone hover:bg-orange"
          }`}
        >
          Continuar comprando
        </Link>
        <Link
          href="/conta"
          className="inline-flex items-center gap-2.5 rounded-full border border-line-strong px-6 py-3.5 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-bone"
        >
          Minha conta
        </Link>
      </div>
    </div>
  );
}
