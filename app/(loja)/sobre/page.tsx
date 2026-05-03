import { ComingSoon } from "@/components/loja/coming-soon";

export const metadata = { title: "Sobre — Solarisis" };

export default function SobrePage() {
  return (
    <ComingSoon
      eyebrow="Sobre · Manifesto"
      title={
        <>
          Nasceu pra <em className="not-italic italic text-orange">viver o sol</em>.
        </>
      }
      description="A história completa da marca, os bastidores do tecido FPU 50+ e a equipe por trás do design vão morar aqui em breve. Por enquanto, o produto fala por si — vai conhecer."
    />
  );
}
