import { Order, OrderItem, Customer, Prisma } from "@prisma/client";

import { blingEnabled, blingFetch } from "./client";

export type EmitNfeResult =
  | {
      ok: true;
      blingId: string;
      number: string | null;
      key: string | null;
      url: string | null;
      pending: boolean;
    }
  | { ok: false; error: string };

type OrderForNfe = Order & {
  items: (OrderItem & { variant: { sku: string } })[];
};

const DEFAULT_NCM = process.env.BLING_DEFAULT_NCM ?? "61091000"; // camisetas malha
const DEFAULT_CFOP = process.env.BLING_DEFAULT_CFOP ?? "5102"; // venda mercadoria estado
const DEFAULT_UNIDADE = "UN";

type CreateNfeResponse = {
  data?: {
    id: string;
    numero?: string | number;
    chaveAcesso?: string;
    linkPDF?: string;
    situacao?: number; // 1 pendente, 5 autorizada, etc.
  };
};

type GetNfeResponse = {
  data?: {
    id: string;
    numero?: string | number;
    chaveAcesso?: string;
    linkPDF?: string;
    situacao?: number;
  };
};

/**
 * Emite NF-e via Bling v3.
 *
 * Estratégia:
 *   1. Cria a nota (POST /nfe) com dados do cliente + itens.
 *   2. Tenta transmitir (POST /nfe/{id}/enviar).
 *   3. Lê de volta (GET /nfe/{id}) pra capturar número/chave/PDF.
 *   4. Se a SEFAZ ainda não respondeu, retorna pending=true com o id —
 *      operação pode revisitar pra sincronizar depois.
 *
 * Campos fiscais (NCM, CFOP) usam defaults via env. Quando o admin
 * adicionar campos fiscais por produto no schema, trocar pelos valores
 * reais do Product.
 */
export async function emitNfe(input: {
  order: OrderForNfe;
  customer: Pick<Customer, "name" | "email" | "cpf" | "phone">;
}): Promise<EmitNfeResult> {
  if (!blingEnabled()) {
    return {
      ok: false,
      error: "Bling não está configurado. Defina BLING_CLIENT_ID, BLING_CLIENT_SECRET e BLING_REFRESH_TOKEN."
    };
  }

  const { order, customer } = input;
  const ship = order.shippingAddress as Prisma.JsonObject;

  if (!customer.cpf) {
    return {
      ok: false,
      error: "Cliente sem CPF. NF-e exige CPF/CNPJ do destinatário."
    };
  }

  const payload = {
    tipo: 1, // 1 = saída (venda)
    numero: undefined as undefined,
    dataOperacao: order.paidAt
      ? order.paidAt.toISOString()
      : new Date().toISOString(),
    contato: {
      nome: customer.name,
      tipoPessoa: "F" as const,
      numeroDocumento: customer.cpf,
      email: customer.email,
      telefone: customer.phone ?? undefined,
      endereco: {
        endereco: String(ship.street ?? ""),
        numero: String(ship.number ?? ""),
        complemento: ship.complement ? String(ship.complement) : undefined,
        bairro: String(ship.district ?? ""),
        cep: String(ship.cep ?? ""),
        municipio: String(ship.city ?? ""),
        uf: String(ship.state ?? ""),
        pais: "Brasil"
      }
    },
    naturezaOperacao: { descricao: "Venda de mercadoria" },
    itens: order.items.map((it) => ({
      codigo: it.variant.sku,
      descricao: it.variantLabel
        ? `${it.productName} (${it.variantLabel})`
        : it.productName,
      unidade: DEFAULT_UNIDADE,
      quantidade: it.quantity,
      valor: Number(it.unitPrice.toFixed(2)),
      tipo: "P" as const, // produto
      classificacaoFiscal: DEFAULT_NCM,
      cfop: DEFAULT_CFOP
    })),
    transporte: {
      fretePorConta: 0, // 0 = emitente; ajustar quando integrar com etiqueta ME
      valorFrete: Number(order.shippingCost.toFixed(2)),
      transportador: order.carrier ? { nome: order.carrier } : undefined
    },
    observacoes: [
      order.notes ? `Obs do cliente: ${order.notes}` : null,
      `Pedido Solarisis #${order.number}`
    ]
      .filter(Boolean)
      .join("\n")
  };

  const created = await blingFetch<CreateNfeResponse>("/nfe", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (!created.ok) {
    return { ok: false, error: created.message };
  }
  const blingId = created.data?.data?.id;
  if (!blingId) {
    return { ok: false, error: "Bling retornou sem ID da NF-e." };
  }

  // Transmissão pra SEFAZ.
  const sent = await blingFetch(`/nfe/${blingId}/enviar`, { method: "POST" });
  if (!sent.ok) {
    // Mesmo se falhar, retornamos o blingId pra admin investigar.
    return {
      ok: true,
      blingId,
      number: null,
      key: null,
      url: null,
      pending: true
    };
  }

  // Lê de volta — SEFAZ pode ainda estar processando, mas frequentemente
  // já respondeu pelo Bling.
  const fetched = await blingFetch<GetNfeResponse>(`/nfe/${blingId}`);
  const nfe = fetched.ok ? fetched.data?.data : null;

  return {
    ok: true,
    blingId,
    number: nfe?.numero != null ? String(nfe.numero) : null,
    key: nfe?.chaveAcesso ?? null,
    url: nfe?.linkPDF ?? null,
    pending: !nfe?.chaveAcesso
  };
}
