const DEFAULT_ITEMS = [
  "Frete grátis acima de R$ 399",
  "Verão 26 — Coleção Solar Flow chegou",
  "10% off na primeira compra · entre na newsletter",
  "Linha mini disponível",
  "FPS 50+ certificado",
  "Pagamento em até 6x sem juros"
];

export function Marquee({ items = DEFAULT_ITEMS }: { items?: string[] }) {
  // Duplica pra animar em loop sem corte
  const content = [...items, ...items];
  return (
    <div className="overflow-hidden border-b border-ink bg-ink py-2.5 text-bone">
      <div
        className="animate-marquee flex w-max gap-12 whitespace-nowrap"
        aria-hidden
      >
        {content.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-12 font-mono text-[11.5px] uppercase tracking-[0.14em]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-orange" />
            <span>{t}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
