"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatBRL } from "@/lib/utils";
import {
  CouponInput,
  type AppliedCoupon
} from "@/components/loja/coupon-input";
import { createOrder, type CheckoutResult } from "./_actions";
import type { ShippingResponse } from "@/app/api/shipping/calculate/route";

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

type ShippingOption = {
  id: string;
  name: string;
  company: string;
  price: number;
  deliveryDays: number;
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

export function CheckoutForm({
  defaults,
  subtotal
}: {
  defaults: Defaults;
  subtotal: number;
}) {
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

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingId, setShippingId] = useState<string>("");
  const [shippingSource, setShippingSource] = useState<
    "melhor-envio" | "fallback" | null
  >(null);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

  const selectedShipping = shippingOptions.find((o) => o.id === shippingId);
  const rawShippingCost = selectedShipping?.price ?? 0;
  const shippingCost = coupon?.freeShipping ? 0 : rawShippingCost;
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount + shippingCost);

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
    await fetchShipping(digits);
  }

  async function fetchShipping(cepDigits: string) {
    setShippingLoading(true);
    setShippingError(null);
    setShippingOptions([]);
    setShippingId("");
    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: cepDigits })
      });
      const data = (await res.json()) as ShippingResponse;
      if (!data.ok) {
        setShippingError(data.error);
        return;
      }
      setShippingOptions(data.options);
      setShippingSource(data.source);
      if (data.options.length > 0) {
        setShippingId(data.options[0].id);
      }
    } catch {
      setShippingError("Não conseguimos calcular o frete agora.");
    } finally {
      setShippingLoading(false);
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

      <fieldset className="flex flex-col gap-3 border-t border-line pt-8">
        <legend className="font-serif text-2xl italic text-ink">
          Frete
        </legend>

        {shippingLoading && (
          <p className="text-sm text-ink-soft">Calculando frete…</p>
        )}
        {shippingError && (
          <p className="text-sm text-destructive">{shippingError}</p>
        )}
        {!shippingLoading &&
          !shippingError &&
          shippingOptions.length === 0 && (
            <p className="text-sm text-ink-soft">
              Informe o CEP de entrega pra calcularmos o frete.
            </p>
          )}

        {shippingOptions.length > 0 && (
          <>
            <input type="hidden" name="shippingId" value={shippingId} />
            <div className="flex flex-col gap-2">
              {shippingOptions.map((opt) => {
                const active = opt.id === shippingId;
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-4 transition-colors",
                      active
                        ? "border-orange bg-orange-soft/40"
                        : "border-line hover:border-orange"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="shippingChoice"
                        value={opt.id}
                        checked={active}
                        onChange={() => setShippingId(opt.id)}
                        className="mt-1 h-4 w-4 accent-orange"
                      />
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {opt.name}
                          {opt.company !== opt.name ? ` · ${opt.company}` : ""}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {opt.deliveryDays > 0
                            ? `${opt.deliveryDays} dia${opt.deliveryDays === 1 ? "" : "s"} útil${opt.deliveryDays === 1 ? "" : "eis"}`
                            : "prazo a confirmar"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-ink">
                      {opt.price === 0 ? "Grátis" : formatBRL(opt.price)}
                    </p>
                  </label>
                );
              })}
            </div>
            {shippingSource === "fallback" && (
              <p className="text-xs text-ink-faint">
                Cálculo em modo fallback (Melhor Envio não configurado).
              </p>
            )}
          </>
        )}
        {errors.shippingId && (
          <p className="text-xs text-destructive">{errors.shippingId}</p>
        )}
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
          Você é redirecionado pro Mercado Pago pra concluir o pagamento
          com segurança.
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

      <fieldset className="flex flex-col gap-3 border-t border-line pt-8">
        <legend className="font-serif text-2xl italic text-ink">
          Cupom
        </legend>
        <CouponInput
          applied={coupon}
          onApply={setCoupon}
          onClear={() => setCoupon(null)}
        />
      </fieldset>

      <div className="flex flex-col gap-2 border-t border-line pt-6 text-sm">
        <div className="flex justify-between text-ink-soft">
          <span>Subtotal</span>
          <span className="text-ink">{formatBRL(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-orange">
            <span>Desconto · {coupon?.code}</span>
            <span>− {formatBRL(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-ink-soft">
          <span>Frete</span>
          <span className="text-ink">
            {selectedShipping
              ? coupon?.freeShipping
                ? <>
                    <span className="mr-1 text-ink-faint line-through">
                      {formatBRL(rawShippingCost)}
                    </span>
                    <span className="text-orange">Grátis</span>
                  </>
                : selectedShipping.price === 0
                  ? "Grátis"
                  : formatBRL(selectedShipping.price)
              : "—"}
          </span>
        </div>
        <div className="mt-2 flex justify-between border-t border-line pt-3 font-serif text-xl italic">
          <span>Total</span>
          <span>{formatBRL(total)}</span>
        </div>
      </div>

      <Button
        size="lg"
        type="submit"
        disabled={isPending || !shippingId}
      >
        {isPending
          ? "Confirmando…"
          : !shippingId
            ? "Selecione o frete"
            : "Confirmar e pagar"}
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
