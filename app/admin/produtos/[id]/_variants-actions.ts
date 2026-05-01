"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

// Color e size sao opcionais individualmente, mas o par
// (productId, color, size) tem unique constraint -- entao
// se ambos forem null, so pode existir uma "variante padrao".
const variantSchema = z.object({
  sku: z.string().trim().min(1, "SKU é obrigatório").max(40),
  color: z.string().trim().max(40).optional().or(z.literal("")),
  size: z.string().trim().max(20).optional().or(z.literal("")),
  priceOverride: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Use formato 99.90")
    .optional()
    .or(z.literal("")),
  stock: z.coerce.number().int().min(0).default(0),
  weight: z.coerce.number().int().min(0).optional()
});

export type VariantFormState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function parse(formData: FormData) {
  return variantSchema.safeParse({
    sku: formData.get("sku"),
    color: formData.get("color") ?? "",
    size: formData.get("size") ?? "",
    priceOverride: formData.get("priceOverride") ?? "",
    stock: formData.get("stock") ?? 0,
    weight: formData.get("weight") || undefined
  });
}

function nullable(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

export async function createVariant(
  productId: string,
  _prev: VariantFormState | undefined,
  formData: FormData
): Promise<VariantFormState> {
  await requireAdmin();

  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const data = parsed.data;
  try {
    await prisma.productVariant.create({
      data: {
        productId,
        sku: data.sku,
        color: nullable(data.color),
        size: nullable(data.size),
        priceOverride: data.priceOverride && data.priceOverride.length > 0 ? data.priceOverride : null,
        stock: data.stock,
        weight: data.weight ?? null
      }
    });
  } catch (err) {
    return { ok: false, error: friendlyConflict(err) };
  }

  revalidatePath(`/admin/produtos/${productId}`);
  revalidatePath("/admin/produtos");
  return { ok: true };
}

export async function updateVariant(
  variantId: string,
  _prev: VariantFormState | undefined,
  formData: FormData
): Promise<VariantFormState> {
  await requireAdmin();

  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const data = parsed.data;
  const existing = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { productId: true }
  });
  if (!existing) {
    return { ok: false, error: "Variante não encontrada." };
  }

  try {
    await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        sku: data.sku,
        color: nullable(data.color),
        size: nullable(data.size),
        priceOverride: data.priceOverride && data.priceOverride.length > 0 ? data.priceOverride : null,
        stock: data.stock,
        weight: data.weight ?? null
      }
    });
  } catch (err) {
    return { ok: false, error: friendlyConflict(err) };
  }

  revalidatePath(`/admin/produtos/${existing.productId}`);
  revalidatePath("/admin/produtos");
  return { ok: true };
}

export async function deleteVariant(variantId: string): Promise<VariantFormState> {
  await requireAdmin();

  const existing = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { productId: true }
  });
  if (!existing) {
    return { ok: false, error: "Variante não encontrada." };
  }

  try {
    await prisma.productVariant.delete({ where: { id: variantId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return {
        ok: false,
        error: "Não dá pra remover: existem pedidos referenciando essa variante."
      };
    }
    throw err;
  }

  revalidatePath(`/admin/produtos/${existing.productId}`);
  revalidatePath("/admin/produtos");
  return { ok: true };
}

function friendlyConflict(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = (err.meta?.target ?? []) as string[];
    if (target.includes("sku")) return "Já existe variante com esse SKU.";
    if (target.includes("color") || target.includes("size")) {
      return "Já existe variante com essa combinação de cor e tamanho.";
    }
    return "Conflito de unicidade.";
  }
  return "Erro ao salvar variante.";
}
