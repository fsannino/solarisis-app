import { Header } from "@/components/loja/header";
import { Footer } from "@/components/loja/footer";

export default function LojaLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
