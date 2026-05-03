import { ComingSoon } from "@/components/loja/coming-soon";

export const metadata = { title: "Sustentabilidade — Solarisis" };

export default function SustentabilidadePage() {
  return (
    <ComingSoon
      eyebrow="Sustentabilidade"
      title={
        <>
          Pensar <em className="not-italic italic text-orange">leve</em>, cobrir bem.
        </>
      }
      description="Tecidos reciclados, embalagens compostáveis, parcerias locais. A página com nossa abordagem completa de sustentabilidade chega em breve."
    />
  );
}
