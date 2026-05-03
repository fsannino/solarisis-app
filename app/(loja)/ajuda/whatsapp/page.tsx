import { redirect } from "next/navigation";

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5500000000000";

export default function WhatsappRedirect() {
  redirect(`https://wa.me/${WHATSAPP_NUMBER}`);
}
