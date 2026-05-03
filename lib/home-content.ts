// Conteúdo editorial da home — copy + assets curados pelo design.
// Quando precisarmos editar pelo admin, migrar pro modelo ContentBlock.

export const BENEFITS = [
  {
    num: "01",
    title: "Proteção FPS 50+",
    body: "Bloqueio de até 98% dos raios UVA e UVB, certificado e duradouro mesmo após muitas lavagens.",
    accent: "orange" as const,
    icon: "sun" as const
  },
  {
    num: "02",
    title: "Conforto térmico",
    body: "Tecidos que respiram, secam rápido e deixam a pele leve mesmo em dias intensos.",
    accent: "green" as const,
    icon: "leaf" as const
  },
  {
    num: "03",
    title: "Liberdade total",
    body: "Cortes que acompanham o corpo em movimento — da areia ao café da tarde.",
    accent: "ink" as const,
    icon: "drop" as const
  }
];

export const TESTIMONIALS = [
  {
    quote:
      "Não tiro mais o macacão Aurora. Volto da praia direto pro almoço sem pensar duas vezes.",
    who: "Marina R., Florianópolis"
  },
  {
    quote:
      "Comprei a linha mini para minhas duas filhas — elas brincam no sol o dia todo, sem queimar.",
    who: "Helena T., Recife"
  },
  {
    quote:
      "É raro um produto unir estética e função desse jeito. Solarisis virou meu uniforme de verão.",
    who: "Camila S., São Paulo"
  }
];

export const INSTA_GRID = [
  "/assets/photos/lifestyle-01.jpg",
  "/assets/photos/lifestyle-02.jpg",
  "/assets/photos/lifestyle-04.jpg",
  "/assets/photos/produto-1.jpg",
  "/assets/photos/lifestyle-05.jpg",
  "/assets/photos/produto-3.jpg"
];

export const HERO_IMAGE = "/assets/photos/lifestyle-03.jpg";

export const CATEGORY_IMAGES = {
  adult: "/assets/photos/lifestyle-04.jpg",
  kids: "/assets/photos/produto-1.jpg"
};
