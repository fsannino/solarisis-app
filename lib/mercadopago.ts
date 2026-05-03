import crypto from "crypto";
import { headers } from "next/headers";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

/**
 * Cliente Mercado Pago. Lê MP_ACCESS_TOKEN do ambiente.
 * Em dev sem token configurado, retorna null e o checkout cai num
 * caminho "sem pagamento" — útil pra rodar a UI localmente.
 */
export function mpClient(): MercadoPagoConfig | null {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;
  return new MercadoPagoConfig({
    accessToken: token,
    options: { timeout: 5000 }
  });
}

export type PreferenceItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
};

export type PreferencePayer = {
  email: string;
  name?: string;
  identification?: { type: "CPF"; number: string };
  phone?: { area_code: string; number: string };
};

/**
 * Cria a preferência de pagamento no Mercado Pago e devolve o init_point
 * (URL pra redirecionar o cliente). external_reference fica com o número
 * do pedido pra reconciliação no webhook.
 */
export async function createPreference(input: {
  orderNumber: string;
  items: PreferenceItem[];
  shippingCost: number;
  payer: PreferencePayer;
  baseUrl: string;
}): Promise<{ id: string; init_point: string } | null> {
  const client = mpClient();
  if (!client) return null;

  const preferenceClient = new Preference(client);

  const allItems: PreferenceItem[] = [...input.items];
  if (input.shippingCost > 0) {
    allItems.push({
      id: "frete",
      title: "Frete",
      quantity: 1,
      unit_price: input.shippingCost
    });
  }

  const preference = await preferenceClient.create({
    body: {
      items: allItems.map((it) => ({
        id: it.id,
        title: it.title,
        quantity: it.quantity,
        unit_price: it.unit_price,
        currency_id: "BRL"
      })),
      payer: {
        email: input.payer.email,
        name: input.payer.name,
        identification: input.payer.identification,
        phone: input.payer.phone
      },
      external_reference: input.orderNumber,
      back_urls: {
        success: `${input.baseUrl}/pedidos/${input.orderNumber}?status=approved`,
        pending: `${input.baseUrl}/pedidos/${input.orderNumber}?status=pending`,
        failure: `${input.baseUrl}/pedidos/${input.orderNumber}?status=rejected`
      },
      auto_return: "approved",
      notification_url: `${input.baseUrl}/api/webhooks/mercado-pago`,
      statement_descriptor: "SOLARISIS"
    }
  });

  if (!preference.id || !preference.init_point) return null;
  return { id: preference.id, init_point: preference.init_point };
}

/**
 * Busca um pagamento no MP pelo ID. Usado no webhook pra confirmar
 * o status real (não confiar no payload entregue).
 */
export async function getPayment(paymentId: string) {
  const client = mpClient();
  if (!client) return null;
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

/**
 * Valida a assinatura do webhook conforme docs do Mercado Pago.
 *
 * Header `x-signature`: "ts=<timestamp>,v1=<hmac>"
 * Manifest: "id:<resource_id>;request-id:<x-request-id>;ts:<ts>;"
 * HMAC: SHA-256 com MP_WEBHOOK_SECRET
 *
 * Retorna true se válida ou se MP_WEBHOOK_SECRET não estiver configurado
 * (modo dev — loga warning). Em prod, sempre exigir.
 */
export function verifyWebhookSignature(input: {
  signatureHeader: string | null;
  requestId: string | null;
  resourceId: string;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "[mercado-pago] MP_WEBHOOK_SECRET ausente — pulando verificação. NÃO USAR EM PRODUÇÃO."
    );
    return true;
  }
  if (!input.signatureHeader || !input.requestId) return false;

  const parts = Object.fromEntries(
    input.signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim() ?? ""];
    })
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${input.resourceId};request-id:${input.requestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(v1, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Resolve a URL pública atual a partir dos headers da request.
 * Usa AUTH_URL como fallback (definido em .env / Vercel).
 */
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  if (host) return `${proto}://${host}`;
  return process.env.AUTH_URL ?? "http://localhost:3000";
}
