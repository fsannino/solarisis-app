import { requireAdmin } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";

import { saveBrand, saveCheckout, saveSeo, saveShipping } from "./_actions";
import { SectionForm } from "./_section-form";

export default async function SettingsAdminPage() {
  await requireAdmin();
  const s = await getSettings();

  const integrations = [
    {
      name: "Mercado Pago",
      hint: "Pagamentos (Pix, cartão, boleto)",
      enabled: Boolean(process.env.MP_ACCESS_TOKEN),
      env: "MP_ACCESS_TOKEN"
    },
    {
      name: "Melhor Envio",
      hint: "Cálculo de frete (Correios + transportadoras)",
      enabled: Boolean(process.env.MELHOR_ENVIO_TOKEN),
      env: "MELHOR_ENVIO_TOKEN"
    },
    {
      name: "Bling",
      hint: "Emissão de NF-e",
      enabled: Boolean(process.env.BLING_CLIENT_ID),
      env: "BLING_CLIENT_ID"
    },
    {
      name: "Resend",
      hint: "E-mails transacionais",
      enabled: Boolean(process.env.RESEND_API_KEY),
      env: "RESEND_API_KEY"
    },
    {
      name: "Vercel Blob",
      hint: "Biblioteca de mídia",
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      env: "BLOB_READ_WRITE_TOKEN"
    }
  ];

  return (
    <div>
      <header className="border-b border-line pb-7">
        <p className="eyebrow">Sistema</p>
        <h1 className="display mt-3 text-[clamp(28px,3vw,36px)]">
          Configurações
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-soft">
          Identidade da marca, frete, checkout e SEO. Integrações são
          configuradas via variáveis de ambiente no Vercel.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SectionForm
          title="Identidade da marca"
          description="Aparece no rodapé, e-mails transacionais e meta tags."
          action={saveBrand}
          fields={[
            {
              name: "brandName",
              label: "Nome",
              required: true,
              defaultValue: s.brandName
            },
            {
              name: "brandTagline",
              label: "Tagline",
              defaultValue: s.brandTagline,
              placeholder: "Moda com proteção solar"
            },
            {
              name: "contactEmail",
              label: "E-mail de contato",
              type: "email",
              defaultValue: s.contactEmail,
              placeholder: "ola@solarisis.com.br"
            },
            {
              name: "contactPhone",
              label: "Telefone",
              defaultValue: s.contactPhone,
              placeholder: "(11) 99999-0000"
            },
            {
              name: "whatsapp",
              label: "WhatsApp (DDI+DDD+número)",
              defaultValue: s.whatsapp,
              placeholder: "5511999990000",
              help: "Só dígitos. Vira link wa.me/."
            },
            {
              name: "instagram",
              label: "Instagram (handle)",
              defaultValue: s.instagram,
              placeholder: "solarisis.br",
              prefix: "@"
            }
          ]}
        />

        <SectionForm
          title="Frete"
          description="Configurações que aparecem no carrinho e no checkout."
          action={saveShipping}
          fields={[
            {
              name: "freeShippingFrom",
              label: "Frete grátis a partir de (R$)",
              type: "number",
              defaultValue: s.freeShippingFrom,
              help: "0 desativa o benefício."
            },
            {
              name: "originCep",
              label: "CEP de origem",
              defaultValue: s.originCep,
              placeholder: "01310-100",
              help: "Usado pra calcular o frete via Melhor Envio."
            }
          ]}
        />

        <SectionForm
          title="Checkout"
          description="Regras aplicadas durante a finalização."
          action={saveCheckout}
          fields={[
            {
              name: "minOrderValue",
              label: "Valor mínimo do pedido (R$)",
              type: "number",
              defaultValue: s.minOrderValue,
              help: "0 desativa o limite mínimo."
            }
          ]}
        />

        <SectionForm
          title="SEO"
          description="Meta tags padrão usadas em páginas que não definem o próprio."
          action={saveSeo}
          fields={[
            {
              name: "metaDescription",
              label: "Meta description padrão",
              type: "textarea",
              defaultValue: s.metaDescription,
              help: "Recomendado entre 120 e 160 caracteres."
            }
          ]}
        />
      </div>

      <section className="mt-10 rounded-lg border border-line bg-surface p-5">
        <header className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Integrações</p>
            <p className="mt-1.5 text-[13px] text-ink-soft">
              Configuradas via variáveis de ambiente. Para ativar uma
              integração, adicione a chave no Vercel e faça redeploy.
            </p>
          </div>
        </header>
        <ul className="divide-y divide-line">
          {integrations.map((i) => (
            <li
              key={i.env}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-[13px] font-medium text-ink">{i.name}</p>
                <p className="text-[12px] text-ink-soft">{i.hint}</p>
                <p className="font-mono text-[10px] text-ink-faint">{i.env}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${
                  i.enabled
                    ? "bg-green/20 text-green"
                    : "bg-line text-ink-soft"
                }`}
              >
                {i.enabled ? "Ativo" : "Desativado"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
