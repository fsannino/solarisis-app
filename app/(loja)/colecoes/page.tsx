import { ComingSoon } from "@/components/loja/coming-soon";

export const metadata = { title: "Coleções — Solarisis" };

export default function ColecoesPage() {
  return (
    <ComingSoon
      eyebrow="Coleções"
      title={
        <>
          Solar Flow,{" "}
          <em className="not-italic italic text-orange">Brisa UV</em>, Raiz Mini.
        </>
      }
      description="Cada coleção tem sua história, paleta e referências. Em breve montamos as páginas dedicadas com lookbook completo. Por ora, navegue pelo catálogo."
      cta={{ href: "/loja", label: "Ver catálogo" }}
    />
  );
}
