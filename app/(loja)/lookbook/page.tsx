import { ComingSoon } from "@/components/loja/coming-soon";

export const metadata = { title: "Lookbook — Solarisis" };

export default function LookbookPage() {
  return (
    <ComingSoon
      eyebrow="Lookbook"
      title={
        <>
          Verão 26 <em className="not-italic italic text-orange">no foco</em>.
        </>
      }
      description="Editorial completo da coleção em breve aqui — fotografia, styling e bastidores. Enquanto a gente finaliza, dá uma olhada nos produtos da temporada."
      cta={{ href: "/loja", label: "Ver coleção" }}
    />
  );
}
