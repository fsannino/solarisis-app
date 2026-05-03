import { Header } from "@/components/loja/header";
import { Footer } from "@/components/loja/footer";
import { Marquee } from "@/components/loja/marquee";
import { WhatsAppButton } from "@/components/loja/whatsapp-button";
import { NewsletterModal } from "@/components/loja/newsletter-modal";

export default function LojaLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Marquee />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
      <NewsletterModal />
    </div>
  );
}
