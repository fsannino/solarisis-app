import { Resend } from "resend";

/**
 * Cliente Resend. Sem RESEND_API_KEY no ambiente, retorna null e a UI
 * funciona normal — emails ficam só logados em console (modo dev).
 */
export function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export const FROM_EMAIL =
  process.env.EMAIL_FROM ?? "Solarisis <pedidos@solarisis.com.br>";

/**
 * Envia um email. Não derruba o caller se o Resend falhar — emails são
 * efeito colateral, não devem bloquear fluxos críticos (criação de
 * pedido, processamento de webhook). Loga erro pra debug.
 */
export async function safeSendEmail(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; id?: string }> {
  const client = resend();
  if (!client) {
    console.info(
      `[email:dev] não enviado (sem RESEND_API_KEY): ${input.subject} → ${input.to}`
    );
    return { ok: false };
  }
  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo
    });
    if (error) {
      console.error("[email] erro ao enviar:", error);
      return { ok: false };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("[email] excecao ao enviar:", err);
    return { ok: false };
  }
}
