"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { slugify } from "@/lib/slug";

const collectionSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(120),
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9-]*$/, "Use só minúsculas, números e hífens")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  heroImageUrl: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
  featured: z
    .preprocess(
      (v) => v === "on" || v === true || v === "true",
      z.boolean()
    )
    .optional(),
  status: z.enum(["active", "draft"]),
  order: z.coerce.number().int().min(0).max(9999).default(0)
});

export type CollectionFormState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function parse(formData: FormData) {
  return collectionSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    heroImageUrl: formData.get("heroImageUrl") ?? "",
    featured: formData.get("featured"),
    status: formData.get("status"),
    order: formData.get("order") ?? "0"
  });
}

export async function createCollection(
  _prev: CollectionFormState | undefined,
  formData: FormData
): Promise<CollectionFormState> {
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
  const slug =
    data.slug && data.slug.length > 0 ? data.slug : slugify(data.name);

  const conflict = await prisma.collection.findUnique({ where: { slug } });
  if (conflict) {
    return { ok: false, error: "Já existe coleção com esse slug." };
  }

  const created = await prisma.collection.create({
    data: {
      name: data.name,
      slug,
      description:
        data.description && data.description.length > 0
          ? data.description
          : null,
      heroImageUrl:
        data.heroImageUrl && data.heroImageUrl.length > 0
          ? data.heroImageUrl
          : null,
      featured: data.featured ?? false,
      status: data.status,
      order: data.order
    }
  });

  revalidatePath("/admin/colecoes");
  redirect(`/admin/colecoes/${created.id}`);
}

export async function updateCollection(
  id: string,
  _prev: CollectionFormState | undefined,
  formData: FormData
): Promise<CollectionFormState> {
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
  const slug =
    data.slug && data.slug.length > 0 ? data.slug : slugify(data.name);

  const conflict = await prisma.collection.findFirst({
    where: { slug, id: { not: id } }
  });
  if (conflict) {
    return { ok: false, error: "Já existe outra coleção com esse slug." };
  }

  await prisma.collection.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      description:
        data.description && data.description.length > 0
          ? data.description
          : null,
      heroImageUrl:
        data.heroImageUrl && data.heroImageUrl.length > 0
          ? data.heroImageUrl
          : null,
      featured: data.featured ?? false,
      status: data.status,
      order: data.order
    }
  });

  revalidatePath("/admin/colecoes");
  revalidatePath(`/admin/colecoes/${id}`);
  return { ok: true };
}

export async function deleteCollection(id: string) {
  await requireAdmin();
  await prisma.collectionProduct.deleteMany({
    where: { collectionId: id }
  });
  await prisma.collection.delete({ where: { id } });
  revalidatePath("/admin/colecoes");
  redirect("/admin/colecoes");
}

const productOpSchema = z.object({
  collectionId: z.string().min(1),
  productId: z.string().min(1)
});

export async function addProductToCollection(formData: FormData) {
  await requireAdmin();
  const parsed = productOpSchema.safeParse({
    collectionId: formData.get("collectionId"),
    productId: formData.get("productId")
  });
  if (!parsed.success) return;

  await prisma.collectionProduct
    .create({
      data: {
        collectionId: parsed.data.collectionId,
        productId: parsed.data.productId
      }
    })
    .catch(() => null); // ignora se já existe (unique compound)

  revalidatePath(`/admin/colecoes/${parsed.data.collectionId}`);
}

export async function removeProductFromCollection(formData: FormData) {
  await requireAdmin();
  const parsed = productOpSchema.safeParse({
    collectionId: formData.get("collectionId"),
    productId: formData.get("productId")
  });
  if (!parsed.success) return;

  await prisma.collectionProduct
    .delete({
      where: {
        collectionId_productId: {
          collectionId: parsed.data.collectionId,
          productId: parsed.data.productId
        }
      }
    })
    .catch(() => null);

  revalidatePath(`/admin/colecoes/${parsed.data.collectionId}`);
}
