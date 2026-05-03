import { ComingSoon } from "@/components/loja/coming-soon";

export const metadata = { title: "Trocas e devoluções — Solarisis" };

export default function TrocasPage() {
  return (
    <ComingSoon
      eyebrow="Ajuda · Trocas e devoluções"
      title={
        <>
          Trocou? <em className="not-italic italic text-orange">Tranquila</em>.
        </>
      }
      description="Você tem 30 dias pra trocar ou devolver — sem perguntas. A política completa, com passo-a-passo, vem aqui em breve. Por enquanto, nos chame no WhatsApp pra resolver direto."
      cta={{ href: "/ajuda/whatsapp", label: "Falar pelo WhatsApp" }}
    />
  );
}
