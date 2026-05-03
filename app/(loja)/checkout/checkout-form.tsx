"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createOrder, type CheckoutResult } from "./_actions";

type Defaults = {
  recipient?: string;
  cpf?: string;
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
};

const PAYMENT_OPTIONS: {
  value: "PIX" | "CREDIT_CARD" | "BOLETO";
  label: string;
  hint: string;
}[] = [
  { value: "PIX", label: "Pix", hint: "Aprovação imediata" },
  { value: "CREDIT_CARD", label: "Cartão de crédito", hint: "Em até 6x sem juros" },
  { value: "BOLETO", label: "Boleto", hint: "Compensação em até 2 dias úteis" }
];

const initialState: CheckoutResult = { ok: false, errors: {} };

export function CheckoutForm({ defaults }: { defaults: Defaults }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: CheckoutResult, formData: FormData) =>
      await createOrder(formData),
    initialState
  );

  const [cep, setCep] = useState(defaults.cep ?? "");
  const [street, setStreet] = useState(defaults.street ?? "");
  const [district, setDistrict] = useState(defaults.district ?? "");
  const [city, setCity] = useState(defaults.city ?? "");
  const [state2, setState2] = useState(defaults.state ?? "");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  async function lookupCep() {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    setCepError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError("CEP não encontrado.");
        return;
      }
      if (data.logradouro) setStreet(data.logradouro);
      if (data.bairro) setDistrict(data.bairro);
      if (data.localidade) setCity(data.localidade);
      if (data.uf) setState2(data.uf);
    } catch {
      setCepError("Não conseguimos buscar o CEP.");
    } finally {
      setCepLoading(false);
    }
  }

  const errors = state.ok ? {} : state.errors;

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {errors._root && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors._root}
        </div>
      )}

      <fieldset className="flex flex-col gap-4">
        <legend className="font-serif text-2xl italic text-ink">
          Entrega
        </legend>

        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <Field label="CEP" error={errors.cep}>
            <Input
              name="cep"
              inputMode="numeric"
              autoComplete="postal-code"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              onBlur={lookupCep}
              placeholder="00000-000"
              required
            />
            {cepLoading && (
              <p className="mt-1 text-xs text-ink-faint">Buscando…</p>
            )}
            {cepError && (
              <p className="mt-1 text-xs text-destructive">{cepError}</p>
            )}
          </Field>
          <Field label="Destinatário" error={errors.recipient}>
            <Input
              name="recipient"
              autoComplete="name"
              defaultValue={defaults.recipient ?? ""}
              required
            />
          </Field>
        </div>

        <Field label="Rua" error={errors.street}>
          <Input
            name="street"
            autoComplete="address-line1"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <Field label="Número" error={errors.number}>
            <Input
              name="number"
              autoComplete="address-line2"
              defaultValue={defaults.number ?? ""}
              required
            />
          </Field>
          <Field label="Complemento" error={errors.complement}>
            <Input
              name="complement"
              autoComplete="address-line3"
              defaultValue={defaults.complement ?? ""}
              placeholder="Apto, bloco, ponto de referência"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bairro" error={errors.district}>
            <Input
              name="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              required
            />
          </Field>
          <Field label="Cidade" error={errors.city}>
            <Input
              name="city"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <Field label="UF" error={errors.state}>
            <Input
              name="state"
              autoComplete="address-level1"
              value={state2}
              maxLength={2}
              onChange={(e) => setState2(e.target.value.toUpperCase())}
              required
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="saveAddress"
            className="h-4 w-4 accent-orange"
          />
          Salvar este endereço na minha conta
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-line pt-8">
        <legend className="font-serif text-2xl italic text-ink">
          Documento e contato
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CPF" error={errors.cpf}>
            <Input
              name="cpf"
              inputMode="numeric"
              defaultValue={defaults.cpf ?? ""}
              placeholder="000.000.000-00"
              required
            />
          </Field>
          <Field label="Telefone" error={errors.phone}>
            <Input
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={defaults.phone ?? ""}
              placeholder="(00) 00000-0000"
              required
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 border-t border-line pt-8">
        <legend className="font-serif text-2xl italic text-ink">
          Pagamento
        </legend>
        <p className="text-sm text-ink-soft">
          O processamento real (Mercado Pago) chega no próximo passo do
          MVP. Aqui você seleciona o método e confirma o pedido em
          <em> aguardando pagamento</em>.
        </p>
        <div className="flex flex-col gap-2">
          {PAYMENT_OPTIONS.map((opt, i) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-4 transition-colors hover:border-orange has-[:checked]:border-orange has-[:checked]:bg-orange-soft/40"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={opt.value}
                defaultChecked={i === 0}
                className="mt-1 h-4 w-4 accent-orange"
                required
              />
              <span>
                <span className="block text-sm font-medium text-ink">
                  {opt.label}
                </span>
                <span className="block text-xs text-ink-soft">
                  {opt.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors.paymentMethod && (
          <p className="text-xs text-destructive">{errors.paymentMethod}</p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3 border-t border-line pt-8">
        <legend className="font-serif text-2xl italic text-ink">
          Observações
        </legend>
        <textarea
          name="notes"
          rows={3}
          maxLength={500}
          placeholder="Algo que a gente precisa saber? Opcional."
          className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
        />
      </fieldset>

      <Button size="lg" type="submit" disabled={isPending}>
        {isPending ? "Confirmando…" : "Confirmar pedido"}
      </Button>
      <p className="text-xs text-ink-faint">
        Ao confirmar, você concorda com nossos termos de uso e política de
        privacidade.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && (
        <p className={cn("text-xs text-destructive")}>{error}</p>
      )}
    </div>
  );
}
