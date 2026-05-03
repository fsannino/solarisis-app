import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/loja/product-card";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: { select: { stock: true } }
    }
  });

  const collections = await prisma.collection.findMany({
    where: { featured: true, status: "active" },
    orderBy: { order: "asc" },
    take: 2
  });

  return (
    <>
      <section className="relative overflow-hidden bg-bg">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:gap-16 md:px-8 md:py-24">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-soft">
              Verão 26
            </p>
            <h1 className="mt-4 font-serif text-5xl italic leading-[1.05] text-ink md:text-7xl">
              Pra quem mora
              <br /> no sol todo dia.
            </h1>
            <p className="mt-6 max-w-md text-lg text-ink-soft">
              Moda solar FPS 50+ pensada pra praia, trilha e o cotidiano.
              Tecidos leves, modelagem que respira, proteção que dura.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/loja">Ver coleção</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/loja?categoria=INFANTIL">Infantil</Link>
              </Button>
            </div>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-line md:aspect-square">
            <Image
              src="https://images.unsplash.com/photo-1571513722275-4b41940f54b8?auto=format&fit=crop&w=1400&q=80"
              alt="Modelo usando peça da coleção Verão 26"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-soft">
              Em destaque
            </p>
            <h2 className="mt-2 font-serif text-3xl italic text-ink md:text-4xl">
              Recém-chegados
            </h2>
          </div>
          <Link
            href="/loja"
            className="hidden text-sm text-ink underline-offset-4 hover:underline md:inline"
          >
            Ver tudo
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {featuredProducts.map((p) => {
            const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
            return (
              <ProductCard
                key={p.id}
                product={{
                  slug: p.slug,
                  name: p.name,
                  type: p.type,
                  fps: p.fps,
                  basePrice: p.basePrice.toNumber(),
                  salePrice: p.salePrice?.toNumber() ?? null,
                  imageUrl: p.images[0]?.url,
                  imageAlt: p.images[0]?.alt ?? p.name,
                  outOfStock: totalStock === 0
                }}
              />
            );
          })}
        </div>
      </section>

      {collections.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/loja?colecao=${col.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-line"
              >
                <div className="relative aspect-[3/2]">
                  {col.heroImageUrl && (
                    <Image
                      src={col.heroImageUrl}
                      alt={col.name}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-surface">
                  <p className="text-xs uppercase tracking-widest opacity-80">
                    Coleção
                  </p>
                  <p className="mt-1 font-serif text-3xl italic">{col.name}</p>
                  {col.description && (
                    <p className="mt-2 max-w-md text-sm opacity-90">
                      {col.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-3 md:px-8">
          {[
            {
              title: "FPS 50+ certificado",
              body: "Tecido testado conforme AS/NZS 4399, o padrão internacional de proteção UV."
            },
            {
              title: "Frete pra todo Brasil",
              body: "Entregamos via Correios e transportadoras parceiras. Acima de R$ 299, frete grátis."
            },
            {
              title: "Trocas em 30 dias",
              body: "Provou e não serviu? Troca ou devolução sem complicação dentro de 30 dias."
            }
          ].map((item) => (
            <div key={item.title}>
              <p className="font-serif text-xl italic text-ink">
                {item.title}
              </p>
              <p className="mt-2 text-sm text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
