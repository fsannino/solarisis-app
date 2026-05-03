import { ComingSoon } from "@/components/loja/coming-soon";

export const metadata = { title: "Diário — Solarisis" };

export default function DiarioPage() {
  return (
    <ComingSoon
      eyebrow="Diário"
      title={
        <>
          Histórias <em className="not-italic italic text-orange">ao sol</em>.
        </>
      }
      description="Editorial, dicas de cuidado com a pele, viagens, colaborações. Estamos preparando os primeiros posts — assine a newsletter pra receber em primeira mão."
    />
  );
}
