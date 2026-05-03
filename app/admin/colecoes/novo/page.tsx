import Link from "next/link";

import { requireAdmin } from "@/lib/auth-helpers";

import { createCollection } from "../_actions";
import { CollectionForm } from "../_form";

export default async function NewCollectionPage() {
  await requireAdmin();

  return (
    <div>
      <header className="flex flex-col gap-3 border-b border-line pb-7">
        <Link
          href="/admin/colecoes"
          className="inline-flex w-fit items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
        >
          ← Coleções
        </Link>
        <p className="eyebrow">Catálogo</p>
        <h1 className="display text-[clamp(28px,3vw,36px)]">
          Nova coleção
        </h1>
        <p className="text-[13px] text-ink-soft">
          Crie uma coleção pra agrupar produtos por temporada, estilo ou
          narrativa. Os produtos são adicionados depois de salvar.
        </p>
      </header>

      <div className="mt-8">
        <CollectionForm
          action={createCollection}
          submitLabel="Criar coleção"
          defaultValues={{ status: "draft" }}
        />
      </div>
    </div>
  );
}
