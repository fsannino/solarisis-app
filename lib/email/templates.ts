import { formatBRL } from "@/lib/utils";

type OrderItem = {
  productName: string;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type OrderEmailData = {
  customerName: string;
  orderNumber: string;
  orderUrl: string;
  paymentMethod: "PIX" | "CREDIT_CARD" | "BOLETO" | "DEBIT_CARD";
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingMethod: string | null;
  shippingAddress: {
    recipient: string;
    street: string;
    number: string;
    complement: string | null;
    district: string;
    city: string;
    state: string;
    cep: string;
  };
  payNowUrl?: string | null;
};

const PAYMENT_LABEL: Record<OrderEmailData["paymentMethod"], string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  BOLETO: "Boleto",
  DEBIT_CARD: "Cartão de débito"
};

/* Estilos inline — clientes de email ignoram <style> e CSS externo. */
const COLORS = {
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  ink: "#1A1614",
  inkSoft: "#6B5F54",
  inkFaint: "#A89B8A",
  line: "#E8DFD0",
  orange: "#FF7A00",
  orangeSoft: "#FFE8D2"
};

const FONT_SERIF =
  "'Fraunces', Georgia, 'Times New Roman', serif";
const FONT_SANS =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function shell(opts: { preheader: string; body: string }) {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Solarisis</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.bg};font-family:${FONT_SANS};color:${COLORS.ink};">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:0;">${opts.preheader}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${COLORS.bg};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:${COLORS.surface};border:1px solid ${COLORS.line};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0;">
                <p style="margin:0;font-family:${FONT_SERIF};font-size:28px;font-style:italic;color:${COLORS.ink};">Solarisis</p>
              </td>
            </tr>
            ${opts.body}
            <tr>
              <td style="padding:24px 32px 32px;border-top:1px solid ${COLORS.line};">
                <p style="margin:0;font-size:12px;line-height:18px;color:${COLORS.inkFaint};">
                  Solarisis · Moda solar FPS 50+ · Curitiba/PR<br />
                  Dúvidas? É só responder esse email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function itemsTable(items: OrderItem[]) {
  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${COLORS.line};font-size:14px;color:${COLORS.ink};">
          <div style="font-family:${FONT_SERIF};font-style:italic;font-size:16px;">${escapeHtml(it.productName)}</div>
          ${it.variantLabel ? `<div style="color:${COLORS.inkSoft};font-size:12px;">${escapeHtml(it.variantLabel)}</div>` : ""}
          <div style="color:${COLORS.inkFaint};font-size:12px;margin-top:2px;">${it.quantity} × ${formatBRL(it.unitPrice)}</div>
        </td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid ${COLORS.line};font-size:14px;color:${COLORS.ink};vertical-align:top;">
          ${formatBRL(it.totalPrice)}
        </td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows}</table>`;
}

function totalsBlock(o: OrderEmailData) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
      <tr>
        <td style="font-size:14px;color:${COLORS.inkSoft};padding:4px 0;">Subtotal</td>
        <td align="right" style="font-size:14px;color:${COLORS.ink};padding:4px 0;">${formatBRL(o.subtotal)}</td>
      </tr>
      <tr>
        <td style="font-size:14px;color:${COLORS.inkSoft};padding:4px 0;">Frete${o.shippingMethod ? ` · ${escapeHtml(o.shippingMethod)}` : ""}</td>
        <td align="right" style="font-size:14px;color:${COLORS.ink};padding:4px 0;">${o.shippingCost === 0 ? "Grátis" : formatBRL(o.shippingCost)}</td>
      </tr>
      <tr>
        <td style="font-family:${FONT_SERIF};font-style:italic;font-size:18px;color:${COLORS.ink};padding-top:12px;border-top:1px solid ${COLORS.line};">Total</td>
        <td align="right" style="font-family:${FONT_SERIF};font-style:italic;font-size:18px;color:${COLORS.ink};padding-top:12px;border-top:1px solid ${COLORS.line};">${formatBRL(o.total)}</td>
      </tr>
    </table>`;
}

function addressBlock(a: OrderEmailData["shippingAddress"]) {
  return `
    <p style="margin:0;font-size:13px;line-height:20px;color:${COLORS.ink};">
      ${escapeHtml(a.recipient)}<br />
      ${escapeHtml(a.street)}, ${escapeHtml(a.number)}${a.complement ? ` · ${escapeHtml(a.complement)}` : ""}<br />
      ${escapeHtml(a.district)} · ${escapeHtml(a.city)}/${escapeHtml(a.state)}<br />
      CEP ${escapeHtml(a.cep)}
    </p>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:${COLORS.orange};color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:9px;font-size:14px;font-weight:500;">${escapeHtml(label)}</a>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------- Templates públicos ---------- */

export function orderCreatedEmail(o: OrderEmailData) {
  const firstName = o.customerName.split(" ")[0];
  const subject = `Recebemos seu pedido #${o.orderNumber}`;
  const preheader = `Aguardando pagamento via ${PAYMENT_LABEL[o.paymentMethod]}.`;

  const body = `
    <tr>
      <td style="padding:8px 32px 0;">
        <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.inkSoft};">Pedido recebido</p>
        <h1 style="margin:8px 0 0;font-family:${FONT_SERIF};font-style:italic;font-size:32px;line-height:1.1;color:${COLORS.ink};">Obrigado, ${escapeHtml(firstName)}.</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:22px;color:${COLORS.inkSoft};">
          Seu pedido <strong style="color:${COLORS.ink};">#${escapeHtml(o.orderNumber)}</strong> está aguardando o pagamento via <strong style="color:${COLORS.ink};">${PAYMENT_LABEL[o.paymentMethod]}</strong>.
          Quando confirmar, a gente começa a separar.
        </p>
        ${
          o.payNowUrl
            ? `<div style="margin-top:24px;">${button(o.payNowUrl, "Pagar com Mercado Pago")}</div>`
            : `<div style="margin-top:24px;">${button(o.orderUrl, "Acompanhar pedido")}</div>`
        }
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0;">
        <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.inkSoft};">Itens</p>
        ${itemsTable(o.items)}
        ${totalsBlock(o)}
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.inkSoft};">Entrega</p>
        ${addressBlock(o.shippingAddress)}
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;">
        <p style="margin:0;font-size:13px;color:${COLORS.inkSoft};">
          Você pode acompanhar o pedido a qualquer momento em
          <a href="${o.orderUrl}" style="color:${COLORS.orange};">${o.orderUrl}</a>.
        </p>
      </td>
    </tr>`;

  return { subject, html: shell({ preheader, body }) };
}

export function orderInvoiceEmail(
  o: OrderEmailData & { nfeNumber: string | null; nfeUrl: string }
) {
  const firstName = o.customerName.split(" ")[0];
  const subject = o.nfeNumber
    ? `Sua NF-e #${o.nfeNumber} · pedido #${o.orderNumber}`
    : `Sua NF-e · pedido #${o.orderNumber}`;
  const preheader = "Acesse a nota fiscal eletrônica do seu pedido.";

  const body = `
    <tr>
      <td style="padding:8px 32px 0;">
        <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.inkSoft};">Nota fiscal disponível</p>
        <h1 style="margin:8px 0 0;font-family:${FONT_SERIF};font-style:italic;font-size:32px;line-height:1.1;color:${COLORS.ink};">Sua NF-e está pronta, ${escapeHtml(firstName)}.</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:22px;color:${COLORS.inkSoft};">
          A nota fiscal do pedido <strong style="color:${COLORS.ink};">#${escapeHtml(o.orderNumber)}</strong> ${o.nfeNumber ? `(NF-e #${escapeHtml(o.nfeNumber)})` : ""} foi autorizada pela SEFAZ.
        </p>
        <div style="margin-top:24px;">${button(o.nfeUrl, "Baixar NF-e (PDF)")}</div>
        <p style="margin:16px 0 0;font-size:12px;color:${COLORS.inkFaint};">
          Guarde uma cópia — vale como comprovante fiscal da compra.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 32px;">
        <p style="margin:0;font-size:13px;color:${COLORS.inkSoft};">
          Acompanhe o pedido em <a href="${o.orderUrl}" style="color:${COLORS.orange};">${o.orderUrl}</a>.
        </p>
      </td>
    </tr>`;

  return { subject, html: shell({ preheader, body }) };
}

export function orderShippedEmail(
  o: OrderEmailData & { trackingCode: string; carrier: string }
) {
  const firstName = o.customerName.split(" ")[0];
  const subject = `Seu pedido #${o.orderNumber} saiu pra entrega`;
  const preheader = `Código de rastreio: ${o.trackingCode}`;

  const body = `
    <tr>
      <td style="padding:8px 32px 0;">
        <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.inkSoft};">A caminho</p>
        <h1 style="margin:8px 0 0;font-family:${FONT_SERIF};font-style:italic;font-size:32px;line-height:1.1;color:${COLORS.ink};">Tá indo pra você, ${escapeHtml(firstName)}.</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:22px;color:${COLORS.inkSoft};">
          Seu pedido <strong style="color:${COLORS.ink};">#${escapeHtml(o.orderNumber)}</strong> saiu pra entrega via <strong style="color:${COLORS.ink};">${escapeHtml(o.carrier)}</strong>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${COLORS.orangeSoft};border-radius:12px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.inkSoft};">Código de rastreio</p>
              <p style="margin:6px 0 0;font-family:${FONT_SANS};font-size:18px;font-weight:500;color:${COLORS.ink};letter-spacing:1px;">${escapeHtml(o.trackingCode)}</p>
            </td>
          </tr>
        </table>
        <div style="margin-top:24px;">${button(o.orderUrl, "Acompanhar pedido")}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.inkSoft};">Endereço de entrega</p>
        ${addressBlock(o.shippingAddress)}
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 32px;">
        <p style="margin:0;font-size:13px;color:${COLORS.inkSoft};">
          Quando chegar, conta pra gente. E se algo não der certo, é só
          responder esse email.
        </p>
      </td>
    </tr>`;

  return { subject, html: shell({ preheader, body }) };
}

export function orderPaidEmail(o: OrderEmailData) {
  const firstName = o.customerName.split(" ")[0];
  const subject = `Pagamento confirmado · pedido #${o.orderNumber}`;
  const preheader = `Estamos preparando seu pedido pra envio.`;

  const body = `
    <tr>
      <td style="padding:8px 32px 0;">
        <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.inkSoft};">Pagamento confirmado</p>
        <h1 style="margin:8px 0 0;font-family:${FONT_SERIF};font-style:italic;font-size:32px;line-height:1.1;color:${COLORS.ink};">Tudo certo, ${escapeHtml(firstName)}.</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:22px;color:${COLORS.inkSoft};">
          Recebemos a confirmação do seu pagamento do pedido <strong style="color:${COLORS.ink};">#${escapeHtml(o.orderNumber)}</strong>.
          Estamos preparando tudo pro envio — você recebe um novo email com o código de rastreio assim que sair.
        </p>
        <div style="margin-top:24px;">${button(o.orderUrl, "Acompanhar pedido")}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0;">
        <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.inkSoft};">Itens</p>
        ${itemsTable(o.items)}
        ${totalsBlock(o)}
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 32px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.inkSoft};">Entrega</p>
        ${addressBlock(o.shippingAddress)}
      </td>
    </tr>`;

  return { subject, html: shell({ preheader, body }) };
}

export type { OrderEmailData };
