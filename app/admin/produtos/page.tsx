import Link from "next/link";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  ARCHIVED: "Arquivado"
};

const CATEGORY_LABEL: Record<string, string> = {
  ADULTO: "Adulto",
  INFANTIL: "Infantil",
  ACESSORIO: "Acessório"
};

const formatBRL = (value: unknown) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function ProductsListPage() {
  await requireAdmin();

  const products = await prisma.product.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      sku: true,
      basePrice: true,
      salePrice: true,
      status: true,
      category: true,
      variants: { select: { stock: true } }
    }
  });

  return (
    <div>
      <header className="border-line flex items-center justify-between border-b pb-6">
        <div>
          <p className="text-ink-soft text-xs uppercase tracking-widest">Catálogo</p>
          <h1 className="font-serif mt-1 text-3xl italic">Produtos</h1>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="bg-orange rounded-md px-4 py-2 text-sm font-medium text-white"
        >
          Novo produto
        </Link>
      </header>

      <section className="mt-8">
        {products.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-surface border-line overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-line text-ink-soft border-b text-left text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Preço</th>
                  <th className="px-4 py-3 font-medium">Estoque</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {products.map((p) => {
                  const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                  return (
                    <tr key={p.id} className="hover:bg-bg">
                      <td className="text-ink px-4 py-3">{p.name}</td>
                      <td className="text-ink-soft px-4 py-3 font-mono text-xs">{p.sku}</td>
                      <td className="text-ink-soft px-4 py-3">{CATEGORY_LABEL[p.category]}</td>
                      <td className="text-ink-soft px-4 py-3">
                        {p.salePrice ? (
                          <>
                            <span className="text-ink">{formatBRL(p.salePrice)}</span>{" "}
                            <span className="text-ink-faint line-through">
                              {formatBRL(p.basePrice)}
                            </span>
                          </>
                        ) : (
                          formatBRL(p.basePrice)
                        )}
                      </td>
                      <td className="text-ink-soft px-4 py-3">{stock}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/produtos/${p.id}`}
                          className="text-ink-soft hover:text-ink text-xs underline"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-bg text-ink-soft",
    ACTIVE: "bg-orange-soft text-ink",
    ARCHIVED: "bg-bg text-ink-faint"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${colors[status] ?? ""}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="bg-surface border-line rounded-lg border px-8 py-16 text-center">
      <p className="font-serif text-2xl italic">Nenhum produto ainda.</p>
      <p className="text-ink-soft mt-2 text-sm">
        Comece cadastrando o primeiro SKU do catálogo.
      </p>
      <Link
        href="/admin/produtos/novo"
        className="bg-orange mt-6 inline-block rounded-md px-5 py-2 text-sm font-medium text-white"
      >
        Cadastrar produto
      </Link>
    </div>
  );
}
