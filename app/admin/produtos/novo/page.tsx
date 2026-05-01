import Link from "next/link";

import { requireAdmin } from "@/lib/auth-helpers";

import { createProduct } from "../_actions";
import { ProductForm } from "../_form";

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <div className="max-w-2xl">
      <header className="border-line border-b pb-6">
        <Link href="/admin/produtos" className="text-ink-soft hover:text-ink text-xs">
          ← Produtos
        </Link>
        <h1 className="font-serif mt-2 text-3xl italic">Novo produto</h1>
      </header>

      <div className="mt-8">
        <ProductForm action={createProduct} submitLabel="Criar produto" />
      </div>
    </div>
  );
}
