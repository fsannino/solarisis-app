import { ComingSoon } from "@/components/loja/coming-soon";

export const metadata = { title: "Atendimento — Solarisis" };

export default function AtendimentoPage() {
  return (
    <ComingSoon
      eyebrow="Ajuda · Atendimento"
      title={
        <>
          Aqui pra <em className="not-italic italic text-orange">te ajudar</em>.
        </>
      }
      description="WhatsApp, email, FAQ — todos os canais de contato vão morar aqui em breve. Pra qualquer coisa urgente, é só clicar no botão verde no canto da tela."
      cta={{ href: "/ajuda/whatsapp", label: "Falar pelo WhatsApp" }}
    />
  );
}
