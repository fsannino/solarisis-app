import { prisma } from "@/lib/db";

import { NewVariantRow } from "./_new-variant-row";
import { VariantRow } from "./_variant-row";

export async function VariantsSection({ productId }: { productId: string }) {
  const variants = await prisma.productVariant.findMany({
    where: { productId },
    orderBy: [{ color: "asc" }, { size: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      sku: true,
      color: true,
      size: true,
      priceOverride: true,
      stock: true,
      weight: true
    }
  });

  return (
    <section className="mt-12">
      <header className="border-line border-b pb-3">
        <h2 className="text-ink-soft text-xs uppercase tracking-widest">Variantes</h2>
        <p className="text-ink-faint mt-1 text-xs">
          Cor × tamanho. Sem variantes, o produto não pode ser vendido — pelo menos uma é
          necessária.
        </p>
      </header>

      <div className="mt-4 space-y-3">
        {variants.length === 0 ? (
          <p className="text-ink-soft bg-bg rounded-md px-4 py-6 text-center text-sm">
            Nenhuma variante ainda. Adicione abaixo.
          </p>
        ) : (
          <>
            <RowHeader />
            {variants.map((v) => (
              <VariantRow
                key={v.id}
                variant={{
                  ...v,
                  priceOverride: v.priceOverride != null ? String(v.priceOverride) : null
                }}
              />
            ))}
          </>
        )}

        <div className="border-line border-t pt-4">
          <p className="text-ink-soft mb-2 text-xs uppercase tracking-wider">Nova variante</p>
          <NewVariantRow productId={productId} />
        </div>
      </div>
    </section>
  );
}

function RowHeader() {
  return (
    <div className="text-ink-faint hidden grid-cols-[1fr_1fr_1.4fr_1fr_0.8fr_0.8fr_auto] gap-2 px-2 text-[10px] uppercase tracking-wider md:grid">
      <span>Cor</span>
      <span>Tamanho</span>
      <span>SKU</span>
      <span>Preço</span>
      <span>Estoque</span>
      <span>Peso (g)</span>
      <span />
    </div>
  );
}
