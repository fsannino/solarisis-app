import Link from "next/link";

import { requireAdmin } from "@/lib/auth-helpers";

import { createProduct } from "../_actions";
import { ProductForm } from "../_form";

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <div>
      <header className="flex flex-col gap-3 border-b border-line pb-7">
        <Link
          href="/admin/produtos"
          className="inline-flex w-fit items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
        >
          ← Produtos
        </Link>
        <p className="eyebrow">Catálogo</p>
        <h1 className="display text-[clamp(28px,3vw,36px)]">
          Novo produto
        </h1>
        <p className="text-[13px] text-ink-soft">
          Cadastre o produto, adicione fotos e publique. As variantes
          (cor × tamanho) aparecem depois de salvar.
        </p>
      </header>

      <div className="mt-8">
        <ProductForm action={createProduct} submitLabel="Criar produto" />
      </div>
    </div>
  );
}
