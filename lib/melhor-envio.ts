/**
 * Cliente Melhor Envio — só o necessário pra Fase 1 (cálculo de frete).
 * Geração de etiqueta e rastreio entram em PR posterior.
 *
 * Doc: https://docs.melhorenvio.com.br/reference/calculo-de-fretes
 *
 * Dimensões mínimas aceitas: 11×16×2 cm (envelope dos Correios). Aplicamos
 * isso a items sem `dimensions` definido — evita erro de "dimensão inválida".
 */

const ME_API = (sandbox: boolean) =>
  sandbox
    ? "https://sandbox.melhorenvio.com.br/api/v2"
    : "https://www.melhorenvio.com.br/api/v2";

export type ShippingOption = {
  serviceId: number;
  name: string; // "PAC", "SEDEX", "Loggi Ponto"
  company: string; // "Correios", "Loggi"
  price: number; // BRL
  deliveryDays: number; // dias úteis estimados
};

type MEProduct = {
  id: string;
  width: number; // cm
  height: number;
  length: number;
  weight: number; // kg
  insurance_value: number;
  quantity: number;
};

type MEServiceResponse = {
  id: number;
  name: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  custom_delivery_time?: number;
  company: { id: number; name: string };
  error?: string;
};

const MIN_DIM_CM = { width: 11, height: 2, length: 16 };
const DEFAULT_INSURANCE = 100; // BRL — valor declarado fictício enquanto não temos preço unitário aqui

export type CalculateInput = {
  toCep: string;
  items: {
    id: string;
    quantity: number;
    /** gramas */
    weight?: number | null;
    /** cm */
    width?: number | null;
    height?: number | null;
    length?: number | null;
    /** preço unitário em BRL — usado como insurance_value */
    insuranceValue?: number;
  }[];
};

function meEnabled() {
  return Boolean(process.env.ME_TOKEN);
}

export async function calculateShipping(
  input: CalculateInput
): Promise<ShippingOption[] | null> {
  if (!meEnabled()) return null;

  const fromCep = (process.env.ME_FROM_CEP ?? "").replace(/\D/g, "");
  const toCep = input.toCep.replace(/\D/g, "");
  if (fromCep.length !== 8 || toCep.length !== 8) return null;

  const products: MEProduct[] = input.items.map((it) => ({
    id: it.id,
    width: Math.max(it.width ?? 0, MIN_DIM_CM.width),
    height: Math.max(it.height ?? 0, MIN_DIM_CM.height),
    length: Math.max(it.length ?? 0, MIN_DIM_CM.length),
    weight: Math.max((it.weight ?? 200) / 1000, 0.1), // gramas → kg, mínimo 100g
    insurance_value: it.insuranceValue ?? DEFAULT_INSURANCE,
    quantity: it.quantity
  }));

  const sandbox =
    (process.env.ME_SANDBOX ?? "true").toLowerCase() === "true";

  const res = await fetch(`${ME_API(sandbox)}/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ME_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Solarisis (contato@solarisis.com.br)"
    },
    body: JSON.stringify({
      from: { postal_code: fromCep },
      to: { postal_code: toCep },
      products
    }),
    // Cache não — preço varia por CEP/dia.
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[melhor-envio] calculate falhou:", res.status, text);
    return null;
  }

  const data = (await res.json()) as MEServiceResponse[];

  return data
    .filter((s) => !s.error && (s.price != null || s.custom_price != null))
    .map((s) => {
      const price = Number(s.custom_price ?? s.price ?? 0);
      const days = s.custom_delivery_time ?? s.delivery_time ?? 0;
      return {
        serviceId: s.id,
        name: s.name,
        company: s.company.name,
        price,
        deliveryDays: days
      };
    })
    .sort((a, b) => a.price - b.price);
}
