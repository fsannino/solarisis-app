import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-20">
      {backBanner && (
        <div
          className={
            backBanner.tone === "ok"
              ? "mb-6 rounded-md border border-orange/30 bg-orange-soft px-4 py-3 text-sm text-ink"
              : backBanner.tone === "error"
                ? "mb-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                : "mb-6 rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-soft"
          }
          role="status"
        >
          {backBanner.msg}
        </div>
      )}
      <div className="rounded-2xl border border-line bg-surface p-8 md:p-12">
        <Badge variant={status.tone}>{status.title}</Badge>
        <h1 className="mt-4 font-serif text-4xl italic text-ink md:text-5xl">
          Obrigado, {session.user.name?.split(" ")[0]}.
        </h1>
        <p className="mt-3 text-ink-soft">{status.body}</p>
        <p className="mt-6 text-sm">
          <span className="text-ink-soft">Número do pedido:</span>{" "}
          <span className="font-medium text-ink">#{order.number}</span>
        </p>
        <p className="text-sm">
          <span className="text-ink-soft">Pagamento:</span>{" "}
          <span className="text-ink">
            {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
          </span>
        </p>
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-6 md:p-8">
        <p className="text-xs uppercase tracking-widest text-ink-soft">
          Itens
        </p>
        <ul className="mt-4 flex flex-col divide-y divide-line">
          {order.items.map((it) => {
            const image = it.variant.product.images[0];
            return (
              <li key={it.id} className="flex gap-4 py-4 first:pt-0">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-line">
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
                    className="font-serif italic text-ink hover:text-orange"
                  >
                    {it.productName}
                  </Link>
                  {it.variantLabel && (
                    <p className="text-xs text-ink-soft">{it.variantLabel}</p>
                  )}
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {it.quantity} × {formatBRL(it.unitPrice.toNumber())}
                  </p>
                </div>
                <p className="text-sm text-ink">
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
        <div className="mt-4 flex justify-between border-t border-line pt-4 font-serif text-xl italic">
          <span>Total</span>
          <span>{formatBRL(order.total.toNumber())}</span>
        </div>
      </section>

      <section className="mt-8 grid gap-4 rounded-2xl border border-line bg-surface p-6 md:grid-cols-2 md:p-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-soft">
            Entrega
          </p>
          <p className="mt-2 text-sm text-ink">
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
          <p className="text-xs uppercase tracking-widest text-ink-soft">
            Próximos passos
          </p>
          <p className="mt-2 text-sm text-ink-soft">
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
          <Button asChild size="lg">
            <a href={initPoint!} rel="noopener noreferrer">
              Pagar com Mercado Pago
            </a>
          </Button>
        )}
        <Button asChild variant={showPayCta ? "outline" : "default"}>
          <Link href="/loja">Continuar comprando</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/conta">Minha conta</Link>
        </Button>
      </div>
    </div>
  );
}
