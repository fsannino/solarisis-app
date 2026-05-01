import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

import { archiveProduct, updateProduct } from "../_actions";
import { ProductForm } from "../_form";
import { VariantsSection } from "./_variants-section";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      description: true,
      category: true,
      gender: true,
      type: true,
      fps: true,
      basePrice: true,
      salePrice: true,
      costPrice: true,
      status: true
    }
  });

  if (!product) {
    notFound();
  }

  const update = updateProduct.bind(null, product.id);

  async function handleArchive() {
    "use server";
    await archiveProduct(product!.id);
  }

  return (
    <div className="max-w-4xl">
      <header className="border-line flex items-end justify-between border-b pb-6">
        <div>
          <Link href="/admin/produtos" className="text-ink-soft hover:text-ink text-xs">
            ← Produtos
          </Link>
          <h1 className="font-serif mt-2 text-3xl italic">{product.name}</h1>
          <p className="text-ink-faint mt-1 text-xs font-mono">{product.sku}</p>
        </div>
        {product.status !== "ARCHIVED" ? (
          <form action={handleArchive}>
            <button
              type="submit"
              className="border-line text-ink-soft hover:border-line-strong hover:text-ink rounded-md border px-3 py-1.5 text-xs transition"
            >
              Arquivar
            </button>
          </form>
        ) : null}
      </header>

      <div className="mt-8 max-w-2xl">
        <ProductForm
          action={update}
          submitLabel="Salvar"
          defaultValues={{
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            description: product.description,
            category: product.category,
            gender: product.gender,
            type: product.type,
            fps: product.fps,
            basePrice: String(product.basePrice),
            salePrice: product.salePrice != null ? String(product.salePrice) : "",
            costPrice: product.costPrice != null ? String(product.costPrice) : "",
            status: product.status
          }}
        />
      </div>

      <VariantsSection productId={product.id} />
    </div>
  );
}
