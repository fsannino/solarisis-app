"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { slugify } from "@/lib/slug";

// Decimal vem como string do form; o Prisma aceita string para campos Decimal.
const productSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(200),
  slug: z
    .string()
    .trim()
    .max(200)
    .regex(/^[a-z0-9-]*$/, "Use só minúsculas, números e hífens")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().min(1, "Descrição é obrigatória"),
  category: z.enum(["ADULTO", "INFANTIL", "ACESSORIO"]),
  gender: z.enum(["FEMININO", "MASCULINO", "UNISSEX", "MENINA", "MENINO"]),
  type: z.string().trim().min(1, "Tipo é obrigatório").max(80),
  fps: z.coerce.number().int().min(0).max(100),
  basePrice: z
    .string()
    .trim()
    .min(1, "Preço base é obrigatório")
    .regex(/^\d+(\.\d{1,2})?$/, "Use formato 99.90"),
  salePrice: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Use formato 99.90")
    .optional()
    .or(z.literal("")),
  costPrice: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Use formato 99.90")
    .optional()
    .or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  sku: z.string().trim().min(1, "SKU é obrigatório").max(40)
});

export type ProductFormState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function parse(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    description: formData.get("description"),
    category: formData.get("category"),
    gender: formData.get("gender"),
    type: formData.get("type"),
    fps: formData.get("fps"),
    basePrice: formData.get("basePrice"),
    salePrice: formData.get("salePrice") ?? "",
    costPrice: formData.get("costPrice") ?? "",
    status: formData.get("status"),
    sku: formData.get("sku")
  });
}

export async function createProduct(
  _prev: ProductFormState | undefined,
  formData: FormData
): Promise<ProductFormState> {
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
  const slug = data.slug && data.slug.length > 0 ? data.slug : slugify(data.name);

  // Conflito de SKU ou slug retorna erro amigável.
  const conflict = await prisma.product.findFirst({
    where: { OR: [{ sku: data.sku }, { slug }] },
    select: { id: true, sku: true, slug: true }
  });
  if (conflict) {
    return {
      ok: false,
      error: conflict.sku === data.sku ? "Já existe produto com esse SKU." : "Já existe produto com esse slug."
    };
  }

  const created = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      sku: data.sku,
      description: data.description,
      category: data.category,
      gender: data.gender,
      type: data.type,
      fps: data.fps,
      basePrice: data.basePrice,
      salePrice: data.salePrice && data.salePrice.length > 0 ? data.salePrice : null,
      costPrice: data.costPrice && data.costPrice.length > 0 ? data.costPrice : null,
      status: data.status,
      publishedAt: data.status === "ACTIVE" ? new Date() : null
    },
    select: { id: true }
  });

  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${created.id}`);
}

export async function updateProduct(
  id: string,
  _prev: ProductFormState | undefined,
  formData: FormData
): Promise<ProductFormState> {
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
  const slug = data.slug && data.slug.length > 0 ? data.slug : slugify(data.name);

  // Conflito de SKU/slug com outro produto.
  const conflict = await prisma.product.findFirst({
    where: {
      AND: [{ id: { not: id } }, { OR: [{ sku: data.sku }, { slug }] }]
    },
    select: { id: true, sku: true }
  });
  if (conflict) {
    return {
      ok: false,
      error: conflict.sku === data.sku ? "Já existe outro produto com esse SKU." : "Já existe outro produto com esse slug."
    };
  }

  const current = await prisma.product.findUnique({
    where: { id },
    select: { status: true, publishedAt: true }
  });
  if (!current) {
    return { ok: false, error: "Produto não encontrado." };
  }

  // Marca publishedAt na primeira vez que vai pra ACTIVE.
  const publishedAt =
    data.status === "ACTIVE" && !current.publishedAt ? new Date() : current.publishedAt;

  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      sku: data.sku,
      description: data.description,
      category: data.category,
      gender: data.gender,
      type: data.type,
      fps: data.fps,
      basePrice: data.basePrice,
      salePrice: data.salePrice && data.salePrice.length > 0 ? data.salePrice : null,
      costPrice: data.costPrice && data.costPrice.length > 0 ? data.costPrice : null,
      status: data.status,
      publishedAt
    }
  });

  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${id}`);
  return { ok: true };
}

export async function archiveProduct(id: string): Promise<void> {
  await requireAdmin();

  await prisma.product.update({
    where: { id },
    data: { status: "ARCHIVED" }
  });

  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${id}`);
}
