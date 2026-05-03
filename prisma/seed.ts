import { PrismaClient, ProductCategory, ProductGender, ProductStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Imagens placeholder (Unsplash). Substituir por upload real quando o admin
// de imagens for construído.
const HERO_BIQUINI =
  "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?auto=format&fit=crop&w=1200&q=80";
const HERO_CAMISETA =
  "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80";
const HERO_INFANTIL =
  "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1200&q=80";
const HERO_CHAPEU =
  "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=80";
const HERO_LEGGING =
  "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1200&q=80";
const HERO_MACACAO =
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80";

type SeedProduct = {
  sku: string;
  slug: string;
  name: string;
  description: string;
  category: ProductCategory;
  gender: ProductGender;
  type: string;
  fps: number;
  basePrice: string;
  salePrice?: string;
  materials: string[];
  tags: string[];
  weight: number;
  imageUrl: string;
  variants: { color: string; size: string; sku: string; stock: number }[];
};

const products: SeedProduct[] = [
  {
    sku: "SOL-BQ-001",
    slug: "biquini-areia-fps50",
    name: "Biquíni Areia",
    description:
      "Biquíni com proteção FPU 50+, tecido leve de secagem rápida e modelagem que se ajusta sem marcar. Pensado pra dia inteiro de praia.",
    category: ProductCategory.ADULTO,
    gender: ProductGender.FEMININO,
    type: "biquini",
    fps: 50,
    basePrice: "229.00",
    materials: ["80% poliamida", "20% elastano"],
    tags: ["praia", "verão", "best-seller"],
    weight: 180,
    imageUrl: HERO_BIQUINI,
    variants: [
      { color: "Areia", size: "P", sku: "SOL-BQ-001-AR-P", stock: 8 },
      { color: "Areia", size: "M", sku: "SOL-BQ-001-AR-M", stock: 12 },
      { color: "Areia", size: "G", sku: "SOL-BQ-001-AR-G", stock: 6 },
      { color: "Terracota", size: "P", sku: "SOL-BQ-001-TE-P", stock: 5 },
      { color: "Terracota", size: "M", sku: "SOL-BQ-001-TE-M", stock: 9 },
      { color: "Terracota", size: "G", sku: "SOL-BQ-001-TE-G", stock: 4 }
    ]
  },
  {
    sku: "SOL-CM-002",
    slug: "camiseta-praia-fps50",
    name: "Camiseta Praia",
    description:
      "Manga curta com FPU 50+ pra quem não abre mão de cobrir os ombros. Caimento solto, gola redonda, tecido respirável.",
    category: ProductCategory.ADULTO,
    gender: ProductGender.UNISSEX,
    type: "camiseta",
    fps: 50,
    basePrice: "189.00",
    salePrice: "159.00",
    materials: ["92% poliéster reciclado", "8% elastano"],
    tags: ["praia", "trilha", "unissex"],
    weight: 220,
    imageUrl: HERO_CAMISETA,
    variants: [
      { color: "Off-white", size: "P", sku: "SOL-CM-002-OF-P", stock: 10 },
      { color: "Off-white", size: "M", sku: "SOL-CM-002-OF-M", stock: 15 },
      { color: "Off-white", size: "G", sku: "SOL-CM-002-OF-G", stock: 11 },
      { color: "Preto", size: "P", sku: "SOL-CM-002-PR-P", stock: 8 },
      { color: "Preto", size: "M", sku: "SOL-CM-002-PR-M", stock: 14 },
      { color: "Preto", size: "G", sku: "SOL-CM-002-PR-G", stock: 9 }
    ]
  },
  {
    sku: "SOL-MC-003",
    slug: "macacao-infantil-fps50",
    name: "Macacão Infantil",
    description:
      "Macacão de manga longa com FPU 50+, perfeito pra criança brincar no sol sem se preocupar. Zíper frontal, fácil de vestir.",
    category: ProductCategory.INFANTIL,
    gender: ProductGender.UNISSEX,
    type: "macacao",
    fps: 50,
    basePrice: "239.00",
    materials: ["88% poliamida", "12% elastano"],
    tags: ["infantil", "praia", "bebê"],
    weight: 200,
    imageUrl: HERO_INFANTIL,
    variants: [
      { color: "Coral", size: "1-2A", sku: "SOL-MC-003-CO-1", stock: 7 },
      { color: "Coral", size: "3-4A", sku: "SOL-MC-003-CO-3", stock: 8 },
      { color: "Coral", size: "5-6A", sku: "SOL-MC-003-CO-5", stock: 5 },
      { color: "Azul", size: "1-2A", sku: "SOL-MC-003-AZ-1", stock: 6 },
      { color: "Azul", size: "3-4A", sku: "SOL-MC-003-AZ-3", stock: 9 },
      { color: "Azul", size: "5-6A", sku: "SOL-MC-003-AZ-5", stock: 4 }
    ]
  },
  {
    sku: "SOL-CH-004",
    slug: "chapeu-veraneio",
    name: "Chapéu Veraneio",
    description:
      "Aba larga, ajuste interno, palha sintética com FPU 50+. Pra você atravessar o verão de cabeça erguida — e protegida.",
    category: ProductCategory.ACESSORIO,
    gender: ProductGender.UNISSEX,
    type: "chapeu",
    fps: 50,
    basePrice: "149.00",
    materials: ["100% palha sintética"],
    tags: ["acessório", "praia"],
    weight: 90,
    imageUrl: HERO_CHAPEU,
    variants: [
      { color: "Natural", size: "Único", sku: "SOL-CH-004-NA-U", stock: 25 },
      { color: "Preto", size: "Único", sku: "SOL-CH-004-PR-U", stock: 18 }
    ]
  },
  {
    sku: "SOL-LG-005",
    slug: "legging-trilha-fps50",
    name: "Legging Trilha",
    description:
      "Legging FPU 50+ com cintura alta e bolso lateral. Compressão suave, segura sem apertar. Trilha, yoga, vida.",
    category: ProductCategory.ADULTO,
    gender: ProductGender.FEMININO,
    type: "legging",
    fps: 50,
    basePrice: "279.00",
    materials: ["83% poliamida reciclada", "17% elastano"],
    tags: ["esporte", "trilha", "yoga"],
    weight: 240,
    imageUrl: HERO_LEGGING,
    variants: [
      { color: "Preto", size: "P", sku: "SOL-LG-005-PR-P", stock: 9 },
      { color: "Preto", size: "M", sku: "SOL-LG-005-PR-M", stock: 13 },
      { color: "Preto", size: "G", sku: "SOL-LG-005-PR-G", stock: 7 },
      { color: "Verde-musgo", size: "P", sku: "SOL-LG-005-VM-P", stock: 4 },
      { color: "Verde-musgo", size: "M", sku: "SOL-LG-005-VM-M", stock: 6 }
    ]
  },
  {
    sku: "SOL-MS-006",
    slug: "manga-longa-surf",
    name: "Manga Longa Surf",
    description:
      "Camiseta manga longa FPU 50+ pensada pro mar. Caimento ajustado pra não enrolar dentro d'água, secagem rápida.",
    category: ProductCategory.ADULTO,
    gender: ProductGender.MASCULINO,
    type: "camiseta",
    fps: 50,
    basePrice: "219.00",
    materials: ["86% poliéster", "14% elastano"],
    tags: ["surf", "praia"],
    weight: 250,
    imageUrl: HERO_MACACAO,
    variants: [
      { color: "Marinho", size: "P", sku: "SOL-MS-006-MA-P", stock: 6 },
      { color: "Marinho", size: "M", sku: "SOL-MS-006-MA-M", stock: 11 },
      { color: "Marinho", size: "G", sku: "SOL-MS-006-MA-G", stock: 9 },
      { color: "Preto", size: "P", sku: "SOL-MS-006-PR-P", stock: 7 },
      { color: "Preto", size: "M", sku: "SOL-MS-006-PR-M", stock: 10 },
      { color: "Preto", size: "G", sku: "SOL-MS-006-PR-G", stock: 8 }
    ]
  }
];

async function main() {
  console.log("Seed: limpando tabelas dependentes...");
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.collectionProduct.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();

  console.log("Seed: criando coleções...");
  const verao = await prisma.collection.create({
    data: {
      name: "Verão 26",
      slug: "verao-26",
      description: "Praia, mar, sal — tudo o que pede sol todo dia.",
      heroImageUrl: HERO_BIQUINI,
      featured: true,
      order: 1
    }
  });
  const infantil = await prisma.collection.create({
    data: {
      name: "Infantil",
      slug: "infantil",
      description: "Pele de criança pede cobertura e leveza.",
      heroImageUrl: HERO_INFANTIL,
      featured: true,
      order: 2
    }
  });

  console.log(`Seed: criando ${products.length} produtos...`);
  for (const p of products) {
    const created = await prisma.product.create({
      data: {
        sku: p.sku,
        slug: p.slug,
        name: p.name,
        description: p.description,
        category: p.category,
        gender: p.gender,
        type: p.type,
        fps: p.fps,
        materials: p.materials,
        tags: p.tags,
        basePrice: p.basePrice,
        salePrice: p.salePrice,
        weight: p.weight,
        status: ProductStatus.ACTIVE,
        publishedAt: new Date(),
        images: {
          create: [
            { url: p.imageUrl, alt: p.name, order: 0, isPrimary: true }
          ]
        },
        variants: {
          create: p.variants
        }
      }
    });

    if (p.category === ProductCategory.INFANTIL) {
      await prisma.collectionProduct.create({
        data: { collectionId: infantil.id, productId: created.id }
      });
    } else {
      await prisma.collectionProduct.create({
        data: { collectionId: verao.id, productId: created.id }
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
