import Link from "next/link";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5500000000000";

export function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}`;
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar pelo WhatsApp"
      className="fixed bottom-6 left-6 z-50 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-green text-white shadow-lg transition-transform hover:scale-105"
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21l1.5-5A8 8 0 1112 20a8 8 0 01-4-1l-5 2z" />
        <path d="M9 10c.5 2 2 3.5 4 4l1.5-1.5 2 1c-.5 1.5-2 2.5-3.5 2.5-3 0-5.5-2.5-5.5-5.5 0-1.5 1-3 2.5-3.5l1 2L9 10z" />
      </svg>
    </Link>
  );
}
