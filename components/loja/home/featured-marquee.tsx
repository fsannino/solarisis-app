// Marquee secundário, exibido entre o hero e a seção de benefícios.
// Mensagens diferentes do marquee de topo.
import { Marquee } from "@/components/loja/marquee";

const ITEMS = [
  "FPS 50+ certificado",
  "Frete grátis acima de R$ 399",
  "Verão 26 — Coleção Solar Flow",
  "Linha família — adulto + mini",
  "Tecidos com secagem rápida",
  "Pagamento em até 6x"
];

export function FeaturedMarquee() {
  return <Marquee items={ITEMS} />;
}
