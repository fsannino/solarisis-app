"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth as customerAuth } from "@/auth/customer";
import { prisma } from "@/lib/db";
import { getCart } from "@/lib/cart";
import { nextOrderNumber } from "@/lib/order-number";
import { FREE_SHIPPING_MIN, SHIPPING_FLAT } from "@/lib/checkout";
import { createPreference, getBaseUrl } from "@/lib/mercadopago";
import { calculateShipping } from "@/lib/melhor-envio";

const onlyDigits = (v: unknown) =>
  typeof v === "string" ? v.replace(/\D/g, "") : v;

const checkoutSchema = z.object({
  cep: z.preprocess(onlyDigits, z.string().length(8, "CEP inválido")),
  street: z.string().min(2, "Informe a rua"),
  number: z.string().min(1, "Informe o número"),
  complement: z.string().optional(),
  district: z.string().min(2, "Informe o bairro"),
  city: z.string().min(2, "Informe a cidade"),
  state: z.string().length(2, "UF deve ter 2 letras"),
  recipient: z.string().min(2, "Informe o destinatário"),
  cpf: z.preprocess(onlyDigits, z.string().length(11, "CPF deve ter 11 dígitos")),
  phone: z.preprocess(onlyDigits, z.string().min(10, "Telefone inválido").max(11)),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "BOLETO"]),
  shippingId: z
    .string()
    .min(1, "Selecione uma opção de frete")
    .regex(/^(me:\d+|fallback:flat)$/, "Opção de frete inválida"),
  saveAddress: z
    .preprocess((v) => v === "on" || v === true || v === "true", z.boolean())
    .optional(),
  notes: z.string().max(500).optional()
});

export type CheckoutFieldErrors = Partial<
  Record<keyof z.infer<typeof checkoutSchema> | "_root", string>
>;

export type CheckoutResult =
  | { ok: true }
  | { ok: false; errors: CheckoutFieldErrors };

export async function createOrder(formData: FormData): Promise<CheckoutResult> {
  const session = await customerAuth();
  if (!session?.user?.id) {
    redirect("/conta/login?from=/checkout");
  }
  const customerId = session.user.id;

  const raw = Object.fromEntries(formData.entries());
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: CheckoutFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof CheckoutFieldErrors;
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }

  const data = parsed.data;

  const cart = await getCart();
  if (!cart || cart.items.length === 0) {
    return { ok: false, errors: { _root: "Seu carrinho está vazio." } };
  }

  // Recarrega variantes pra checar estoque atualizado e calcular total
  // a partir dos preços do banco (nunca confiar em valor enviado pelo cliente).
  const variantIds = cart.items.map((it) => it.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true }
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  let subtotal = 0;
  const orderItemsData: {
    variantId: string;
    productName: string;
    variantLabel: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[] = [];

  for (const item of cart.items) {
    const v = variantMap.get(item.variantId);
    if (!v) {
      return {
        ok: false,
        errors: { _root: "Um item do carrinho não está mais disponível." }
      };
    }
    if (v.stock < item.quantity) {
      return {
        ok: false,
        errors: {
          _root: `Estoque insuficiente para ${v.product.name} — disponível: ${v.stock}.`
        }
      };
    }
    const unit =
      v.priceOverride?.toNumber() ??
      v.product.salePrice?.toNumber() ??
      v.product.basePrice.toNumber();
    const total = unit * item.quantity;
    subtotal += total;
    orderItemsData.push({
      variantId: v.id,
      productName: v.product.name,
      variantLabel: [v.color, v.size].filter(Boolean).join(" · ") || null,
      quantity: item.quantity,
      unitPrice: unit,
      totalPrice: total
    });
  }

  // Recalcula frete via Melhor Envio com os mesmos dados do carrinho.
  // Nunca confiar no preço enviado pelo cliente. Se o cliente escolheu
  // uma opção que não existe mais (preço mudou, serviço sumiu), erra
  // pra ele revalidar.
  const shippingItems = cart.items.map((it) => {
    const dim = (it.variant.product.dimensions ?? null) as
      | { length?: number; width?: number; height?: number }
      | null;
    const unit =
      it.variant.priceOverride?.toNumber() ??
      it.variant.product.salePrice?.toNumber() ??
      it.variant.product.basePrice.toNumber();
    return {
      id: it.variantId,
      quantity: it.quantity,
      weight: it.variant.weight ?? it.variant.product.weight ?? null,
      width: dim?.width ?? null,
      height: dim?.height ?? null,
      length: dim?.length ?? null,
      insuranceValue: unit
    };
  });

  const meOptions = await calculateShipping({
    toCep: data.cep,
    items: shippingItems
  });

  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_MIN;

  let shipping = 0;
  let shippingMethodLabel: string | null = null;
  let shippingCarrier: string | null = null;

  if (data.shippingId.startsWith("me:")) {
    if (!meOptions || meOptions.length === 0) {
      return {
        ok: false,
        errors: { shippingId: "Frete indisponível. Recalcule o CEP." }
      };
    }
    const serviceId = Number(data.shippingId.slice(3));
    const chosen = meOptions.find((o) => o.serviceId === serviceId);
    if (!chosen) {
      return {
        ok: false,
        errors: {
          shippingId:
            "Opção de frete não está mais disponível. Recalcule o CEP."
        }
      };
    }
    shipping = qualifiesForFreeShipping ? 0 : chosen.price;
    shippingMethodLabel = chosen.name;
    shippingCarrier = chosen.company;
  } else {
    // fallback:flat — só permitido se ME não está habilitado.
    if (meOptions && meOptions.length > 0) {
      return {
        ok: false,
        errors: {
          shippingId: "Selecione uma das opções calculadas pra esse CEP."
        }
      };
    }
    shipping = qualifiesForFreeShipping ? 0 : SHIPPING_FLAT;
    shippingMethodLabel = "Envio padrão";
    shippingCarrier = "Correios";
  }

  const total = subtotal + shipping;

  const addressSnapshot = {
    recipient: data.recipient,
    cep: data.cep,
    street: data.street,
    number: data.number,
    complement: data.complement || null,
    district: data.district,
    city: data.city,
    state: data.state.toUpperCase(),
    phone: data.phone
  };

  const number = await nextOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    // Atualiza customer com cpf/phone caso ainda não tenha — evita
    // pedir de novo no próximo checkout.
    await tx.customer.update({
      where: { id: customerId },
      data: {
        cpf: data.cpf,
        phone: data.phone
      }
    });

    if (data.saveAddress) {
      await tx.address.create({
        data: {
          customerId,
          recipient: data.recipient,
          cep: data.cep,
          street: data.street,
          number: data.number,
          complement: data.complement || null,
          district: data.district,
          city: data.city,
          state: data.state.toUpperCase(),
          isDefault: false
        }
      });
    }

    // Decrementa estoque das variantes (otimista — verificamos acima).
    for (const item of cart.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    const created = await tx.order.create({
      data: {
        number,
        customerId,
        subtotal,
        shippingCost: shipping,
        total,
        shippingAddress: addressSnapshot,
        billingAddress: addressSnapshot,
        paymentMethod: data.paymentMethod,
        paymentStatus: "PENDING",
        status: "PENDING",
        shippingMethod: shippingMethodLabel,
        carrier: shippingCarrier,
        notes: data.notes || null,
        items: {
          create: orderItemsData
        },
        events: {
          create: {
            type: "order_created",
            message: "Pedido criado, aguardando pagamento.",
            metadata: {
              paymentMethod: data.paymentMethod,
              shipping: shippingMethodLabel,
              carrier: shippingCarrier
            }
          }
        }
      }
    });

    // Limpa carrinho
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  // Cria preferência no Mercado Pago. Se MP_ACCESS_TOKEN não estiver
  // configurado (dev sem credencial), cai pra confirmação local sem
  // pagamento. Em prod, redireciona pro init_point.
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { email: true, name: true }
  });

  let initPoint: string | null = null;
  try {
    const baseUrl = await getBaseUrl();
    const pref = await createPreference({
      orderNumber: order.number,
      items: orderItemsData.map((it) => ({
        id: it.variantId,
        title: it.variantLabel
          ? `${it.productName} (${it.variantLabel})`
          : it.productName,
        quantity: it.quantity,
        unit_price: it.unitPrice
      })),
      shippingCost: shipping,
      payer: {
        email: customer?.email ?? "",
        name: customer?.name ?? data.recipient,
        identification: { type: "CPF", number: data.cpf },
        phone: {
          area_code: data.phone.slice(0, 2),
          number: data.phone.slice(2)
        }
      },
      baseUrl
    });
    if (pref) {
      initPoint = pref.init_point;
      await prisma.order.update({
        where: { id: order.id },
        data: {
          gatewayId: pref.id,
          paymentDetails: { initPoint: pref.init_point }
        }
      });
    }
  } catch (err) {
    // Não derruba o pedido se o MP falhar — pedido fica PENDING e o
    // cliente pode tentar de novo via /pedidos/[number].
    console.error("[mercado-pago] erro ao criar preference:", err);
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "payment_error",
        message: "Falha ao criar preferência no Mercado Pago.",
        metadata: { error: err instanceof Error ? err.message : String(err) }
      }
    });
  }

  revalidatePath("/", "layout");
  redirect(initPoint ?? `/pedidos/${order.number}`);
}
