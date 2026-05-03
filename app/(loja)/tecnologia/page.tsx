import { ComingSoon } from "@/components/loja/coming-soon";

export const metadata = { title: "Tecnologia FPU — Solarisis" };

export default function TecnologiaPage() {
  return (
    <ComingSoon
      eyebrow="Tecnologia"
      title={
        <>
          O que faz um tecido <em className="not-italic italic text-orange">FPU 50+</em>.
        </>
      }
      description="Bloqueio dos raios UV, certificações, durabilidade após lavagens, conforto térmico. Vamos detalhar tudo isso em breve — a página técnica está em produção."
    />
  );
}
