export default function Home() {
  return (
    <main className="min-h-screen px-6 py-20 md:px-12">
      <section className="mx-auto max-w-3xl">
        <p className="text-ink-soft text-sm uppercase tracking-widest">
          Solarisis
        </p>
        <h1 className="font-serif text-5xl italic leading-tight md:text-7xl">
          Moda solar para o sol todo dia.
        </h1>
        <p className="text-ink-soft mt-6 max-w-xl text-lg">
          Bootstrap em andamento. As telas de loja e admin serão construídas
          a partir do handoff em <code>design_handoff_solarisis/</code>.
        </p>
        <a
          href="https://solarisis.vercel.app"
          className="bg-orange mt-10 inline-block rounded-md px-6 py-3 text-white"
        >
          Ver protótipo
        </a>
      </section>
    </main>
  );
}
