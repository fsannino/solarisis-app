/**
 * Seed do catálogo Solarisis — 16 produtos espelhando o data.jsx do design
 * oficial (Claude Design handoff).
 *
 * AVISO: esse seed é DESTRUTIVO pro catálogo + pedidos de teste:
 *   - Apaga: ProductVariant, Product, ProductImage, Collection, Cart,
 *     CartItem, Order, OrderItem, OrderEvent, Return, etc.
 *   - PRESERVA: User (admin), Customer, Address.
 *
 * Pra rodar (depois de `vercel env pull .env`):
 *   npm run prisma:seed
 */

import {
  PrismaClient,
  ProductCategory,
  ProductGender,
  ProductStatus
} from "@prisma/client";

const prisma = new PrismaClient();

const SIZES_ADULT = ["PP", "P", "M", "G", "GG"];
const SIZES_KIDS = ["2", "4", "6", "8", "10", "12"];

type SeedColor = { name: string };

type SeedProduct = {
  sku: string;
  slug: string;
  name: string;
  description: string;
  category: ProductCategory;
  gender: ProductGender;
  type: string;
  basePrice: string;
  tag: string | null;
  collectionSlug: string;
  imageUrl: string;
  imageAlt: string;
  colors: SeedColor[];
  weight: number;
  materials: string[];
};

const ADULT_DESC =
  "Peça FPU 50+ certificada, modelagem que segue o corpo sem apertar e tecido de secagem rápida. Funciona da areia ao café da tarde.";
const KIDS_DESC =
  "Peça infantil FPU 50+ — proteção que dura o dia todo de brincadeira sob o sol, sem prender o movimento. Tecido fácil de lavar.";

const ADULT_MATERIALS = ["80% poliamida", "20% elastano"];
const KIDS_MATERIALS = ["88% poliamida", "12% elastano"];

const ADULT: SeedProduct[] = [
  {
    sku: "SOL-AD-MAIO-SOLIS",
    slug: "maio-solis-floral",
    name: "Maiô Solis Floral",
    description:
      "Maiô de costas baixas, alça fina e modelagem que estiliza o tronco. Estampa floral assinada Solarisis, FPU 50+. " +
      ADULT_DESC,
    category: ProductCategory.ADULTO,
    gender: ProductGender.FEMININO,
    type: "Maiô",
    basePrice: "489.00",
    tag: "Bestseller",
    collectionSlug: "solar-flow",
    imageUrl: "/assets/photos/lifestyle-02.jpg",
    imageAlt: "Maiô Solis Floral",
    colors: [{ name: "Floral Rosa" }, { name: "Preto Floral" }],
    weight: 180,
    materials: ADULT_MATERIALS
  },
  {
    sku: "SOL-AD-BIQ-MARE",
    slug: "biquini-mare-floral",
    name: "Biquíni Maré Floral",
    description:
      "Top com bojo removível e calcinha cintura média. Estampa exclusiva, FPU 50+. " +
      ADULT_DESC,
    category: ProductCategory.ADULTO,
    gender: ProductGender.FEMININO,
    type: "Biquíni",
    basePrice: "359.00",
    tag: null,
    collectionSlug: "solar-flow",
    imageUrl: "/assets/photos/lifestyle-01.jpg",
    imageAlt: "Biquíni Maré Floral",
    colors: [{ name: "Floral" }, { name: "Pink" }],
    weight: 140,
    materials: ADULT_MATERIALS
  },
  {
    sku: "SOL-AD-MAC-AURORA",
    slug: "macacao-aurora-olive",
    name: "Macacão Aurora Olive",
    description:
      "Macacão manga longa com zíper frontal, FPU 50+. Cobertura completa pra trilha, surf e cidade. " +
      ADULT_DESC,
    category: ProductCategory.ADULTO,
    gender: ProductGender.FEMININO,
    type: "Macacão",
    basePrice: "629.00",
    tag: "Novo",
    collectionSlug: "brisa-uv",
    imageUrl: "/assets/photos/lifestyle-07.jpg",
    imageAlt: "Macacão Aurora Olive",
    colors: [{ name: "Olive" }, { name: "Areia" }],
    weight: 320,
    materials: ADULT_MATERIALS
  },
  {
    sku: "SOL-AD-MAIO-CORAL",
    slug: "maio-coral-azul",
    name: "Maiô Coral Azul",
    description:
      "Maiô minimalista com alças cruzadas nas costas, em azul cobalto. FPU 50+. " +
      ADULT_DESC,
    category: ProductCategory.ADULTO,
    gender: ProductGender.FEMININO,
    type: "Maiô",
    basePrice: "539.00",
    tag: null,
    collectionSlug: "brisa-uv",
    imageUrl: "/assets/photos/lifestyle-04.jpg",
    imageAlt: "Maiô Coral Azul",
    colors: [{ name: "Azul" }],
    weight: 180,
    materials: ADULT_MATERIALS
  },
  {
    sku: "SOL-AD-BIQ-DUNA",
    slug: "biquini-duna",
    name: "Biquíni Duna",
    description:
      "Top tomara-que-caia e calcinha franzida. Estampa Duna, FPU 50+. " +
      ADULT_DESC,
    category: ProductCategory.ADULTO,
    gender: ProductGender.FEMININO,
    type: "Biquíni",
    basePrice: "379.00",
    tag: null,
    collectionSlug: "solar-flow",
    imageUrl: "/assets/photos/lifestyle-05.jpg",
    imageAlt: "Biquíni Duna",
    colors: [{ name: "Floral" }, { name: "Rosa" }],
    weight: 140,
    materials: ADULT_MATERIALS
  },
  {
    sku: "SOL-AD-MAC-BEACH",
    slug: "macacao-beach-print",
    name: "Macacão Beach Print",
    description:
      "Macacão de manga longa em estampa exclusiva da temporada. Zíper traseiro, FPU 50+. Edição limitada. " +
      ADULT_DESC,
    category: ProductCategory.ADULTO,
    gender: ProductGender.FEMININO,
    type: "Macacão",
    basePrice: "689.00",
    tag: "Edição limitada",
    collectionSlug: "brisa-uv",
    imageUrl: "/assets/photos/produto-mac-adulto-preto.jpg",
    imageAlt: "Macacão Beach Print",
    colors: [{ name: "Floral" }, { name: "Preto" }],
    weight: 320,
    materials: ADULT_MATERIALS
  },
  {
    sku: "SOL-AD-CAM-ONDA",
    slug: "camiseta-uv-onda",
    name: "Camiseta UV Onda",
    description:
      "Camiseta UV manga curta, gola redonda e caimento solto. FPU 50+, secagem rápida. " +
      ADULT_DESC,
    category: ProductCategory.ADULTO,
    gender: ProductGender.UNISSEX,
    type: "Camiseta UV",
    basePrice: "249.00",
    tag: null,
    collectionSlug: "brisa-uv",
    imageUrl: "/assets/photos/lifestyle-03.jpg",
    imageAlt: "Camiseta UV Onda",
    colors: [{ name: "Floral" }],
    weight: 200,
    materials: ADULT_MATERIALS
  },
  {
    sku: "SOL-AD-MAIO-LIBERTY",
    slug: "maio-liberty-costas",
    name: "Maiô Liberty Costas",
    description:
      "Maiô recortes laterais e detalhe de amarração nas costas. Estampa floral preto. FPU 50+. " +
      ADULT_DESC,
    category: ProductCategory.ADULTO,
    gender: ProductGender.FEMININO,
    type: "Maiô",
    basePrice: "519.00",
    tag: null,
    collectionSlug: "solar-flow",
    imageUrl: "/assets/photos/lifestyle-06.jpg",
    imageAlt: "Maiô Liberty Costas",
    colors: [{ name: "Floral Preto" }],
    weight: 180,
    materials: ADULT_MATERIALS
  }
];

const KIDS: SeedProduct[] = [
  {
    sku: "SOL-MN-MAC-GEO",
    slug: "macacao-mini-geo",
    name: "Macacão Mini Geo",
    description:
      "Macacão de manga longa com zíper frontal, em verde militar. " + KIDS_DESC,
    category: ProductCategory.INFANTIL,
    gender: ProductGender.UNISSEX,
    type: "Macacão",
    basePrice: "299.00",
    tag: "Bestseller",
    collectionSlug: "raiz-mini",
    imageUrl: "/assets/photos/mac-inf-verde-militar.jpg",
    imageAlt: "Macacão Mini Geo",
    colors: [{ name: "Verde Militar" }],
    weight: 220,
    materials: KIDS_MATERIALS
  },
  {
    sku: "SOL-MN-MAC-FLAMINGO",
    slug: "macacao-mini-flamingo",
    name: "Macacão Mini Flamingo",
    description:
      "Macacão manga longa com mix de pink e amarelo. " + KIDS_DESC,
    category: ProductCategory.INFANTIL,
    gender: ProductGender.MENINA,
    type: "Macacão",
    basePrice: "309.00",
    tag: "Querido",
    collectionSlug: "raiz-mini",
    imageUrl: "/assets/photos/produto-1.jpg",
    imageAlt: "Macacão Mini Flamingo",
    colors: [{ name: "Pink Amarelo" }],
    weight: 220,
    materials: KIDS_MATERIALS
  },
  {
    sku: "SOL-MN-CONJ-SURF",
    slug: "conjunto-mini-surf",
    name: "Conjunto Mini Surf",
    description:
      "Conjunto camiseta UV + sungão. Estampa Surf, FPU 50+. " + KIDS_DESC,
    category: ProductCategory.INFANTIL,
    gender: ProductGender.UNISSEX,
    type: "Camiseta UV",
    basePrice: "219.00",
    tag: null,
    collectionSlug: "raiz-mini",
    imageUrl: "/assets/photos/camiseta-mg-infantil.jpg",
    imageAlt: "Conjunto Mini Surf",
    colors: [{ name: "Preto Floral" }],
    weight: 180,
    materials: KIDS_MATERIALS
  },
  {
    sku: "SOL-MN-CRO-PINK",
    slug: "cropped-mini-pink",
    name: "Cropped Mini Pink",
    description: "Cropped básico em pink, FPU 50+. " + KIDS_DESC,
    category: ProductCategory.INFANTIL,
    gender: ProductGender.MENINA,
    type: "Cropped",
    basePrice: "169.00",
    tag: null,
    collectionSlug: "raiz-mini",
    imageUrl: "/assets/photos/produto-3.jpg",
    imageAlt: "Cropped Mini Pink",
    colors: [{ name: "Pink" }],
    weight: 100,
    materials: KIDS_MATERIALS
  },
  {
    sku: "SOL-MN-SAIA-MARITIMA",
    slug: "saia-longa-mini-maritima",
    name: "Saia Longa Mini Marítima",
    description:
      "Saia longa em malha leve, com elástico no cós. Tom azul. " + KIDS_DESC,
    category: ProductCategory.INFANTIL,
    gender: ProductGender.MENINA,
    type: "Saia longa",
    basePrice: "239.00",
    tag: "Novo",
    collectionSlug: "raiz-mini",
    imageUrl: "/assets/photos/produto-7.jpg",
    imageAlt: "Saia Longa Mini Marítima",
    colors: [{ name: "Azul" }],
    weight: 160,
    materials: KIDS_MATERIALS
  },
  {
    sku: "SOL-MN-MAC-PINK",
    slug: "macacao-mini-pink",
    name: "Macacão Mini Pink",
    description: "Macacão manga longa em duas cores. " + KIDS_DESC,
    category: ProductCategory.INFANTIL,
    gender: ProductGender.MENINA,
    type: "Macacão",
    basePrice: "289.00",
    tag: null,
    collectionSlug: "raiz-mini",
    imageUrl: "/assets/photos/dsc-6273.jpg",
    imageAlt: "Macacão Mini Pink",
    colors: [{ name: "Pink" }, { name: "Preto" }],
    weight: 220,
    materials: KIDS_MATERIALS
  },
  {
    sku: "SOL-MN-MAC-VERDE",
    slug: "macacao-mini-verde-uni",
    name: "Macacão Mini Verde Uni",
    description: "Macacão manga longa em verde liso. " + KIDS_DESC,
    category: ProductCategory.INFANTIL,
    gender: ProductGender.UNISSEX,
    type: "Macacão",
    basePrice: "279.00",
    tag: null,
    collectionSlug: "raiz-mini",
    imageUrl: "/assets/photos/mac-inf-verde-uni.jpg",
    imageAlt: "Macacão Mini Verde Uni",
    colors: [{ name: "Verde" }],
    weight: 220,
    materials: KIDS_MATERIALS
  },
  {
    sku: "SOL-MN-MAC-AQUA",
    slug: "macacao-mini-aqua-peixes",
    name: "Macacão Mini Aqua Peixes",
    description:
      "Macacão manga longa com estampa de peixes. Verde água. " + KIDS_DESC,
    category: ProductCategory.INFANTIL,
    gender: ProductGender.UNISSEX,
    type: "Macacão",
    basePrice: "299.00",
    tag: null,
    collectionSlug: "raiz-mini",
    imageUrl: "/assets/photos/mac-inf-verde-agua-peixe.jpg",
    imageAlt: "Macacão Mini Aqua Peixes",
    colors: [{ name: "Verde Água" }],
    weight: 220,
    materials: KIDS_MATERIALS
  }
];

const PRODUCTS = [...ADULT, ...KIDS];

const COLLECTIONS = [
  {
    slug: "solar-flow",
    name: "Solar Flow",
    description: "Cortes fluidos e estampas vibrantes para dias longos de sol.",
    heroImageUrl: "/assets/photos/lifestyle-02.jpg",
    order: 1
  },
  {
    slug: "brisa-uv",
    name: "Brisa UV",
    description:
      "Tecidos respiráveis com FPU 50+ para movimentos livres do mergulho ao café da tarde.",
    heroImageUrl: "/assets/photos/lifestyle-07.jpg",
    order: 2
  },
  {
    slug: "raiz-mini",
    name: "Raiz Mini",
    description: "A mesma proteção, em peças que crescem com eles.",
    heroImageUrl: "/assets/photos/produto-1.jpg",
    order: 3
  }
];

function stockFor(productIdx: number, colorIdx: number, sizeIdx: number) {
  // Padrão pseudo-determinístico: garante variação. P/M/G têm mais; PP/GG menos.
  const sizeWeight = [3, 8, 12, 9, 4][sizeIdx % 5] ?? 5;
  return Math.max(0, sizeWeight + ((productIdx + colorIdx) % 4));
}

async function main() {
  console.log("Seed: limpando catalogo + dados de teste...");
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.return.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.collectionProduct.deleteMany();
  await prisma.warehouseStock.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();

  console.log("Seed: criando coleções...");
  const collectionsBySlug = new Map<
    string,
    Awaited<ReturnType<typeof prisma.collection.create>>
  >();
  for (const c of COLLECTIONS) {
    const created = await prisma.collection.create({
      data: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        heroImageUrl: c.heroImageUrl,
        featured: true,
        order: c.order
      }
    });
    collectionsBySlug.set(c.slug, created);
  }

  console.log(`Seed: criando ${PRODUCTS.length} produtos com variantes...`);
  for (let pi = 0; pi < PRODUCTS.length; pi++) {
    const p = PRODUCTS[pi];
    const sizes =
      p.category === ProductCategory.INFANTIL ? SIZES_KIDS : SIZES_ADULT;

    const variantsData = p.colors.flatMap((color, ci) =>
      sizes.map((size, si) => ({
        sku: `${p.sku}-${color.name.replace(/\s+/g, "").slice(0, 4).toUpperCase()}-${size}`,
        color: color.name,
        size,
        stock: stockFor(pi, ci, si),
        weight: p.weight
      }))
    );

    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        slug: p.slug,
        name: p.name,
        description: p.description,
        category: p.category,
        gender: p.gender,
        type: p.type,
        fps: 50,
        materials: p.materials,
        tags: p.tag ? [p.tag] : [],
        basePrice: p.basePrice,
        weight: p.weight,
        status: ProductStatus.ACTIVE,
        publishedAt: new Date(),
        images: {
          create: [
            { url: p.imageUrl, alt: p.imageAlt, order: 0, isPrimary: true }
          ]
        },
        variants: { create: variantsData }
      }
    });

    const collection = collectionsBySlug.get(p.collectionSlug);
    if (collection) {
      await prisma.collectionProduct.create({
        data: { collectionId: collection.id, productId: product.id }
      });
    }
  }

  console.log("Seed: pronto.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
