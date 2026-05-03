/**
 * Cliente Bling v3 — só o necessário pra emissão de NF-e.
 *
 * Doc: https://developer.bling.com.br/referencia
 * OAuth2: https://developer.bling.com.br/aplicativos
 *
 * Estratégia de token:
 *   - Refresh token mora em BLING_REFRESH_TOKEN (env).
 *   - Access token é cacheado em memória do processo com TTL.
 *   - Se Bling rotacionar o refresh_token, o novo é logado e
 *     mantido em memória até reiniciar; em prod, persistir em DB
 *     é a evolução natural (TODO: modelo IntegrationCredential).
 *
 * Sem BLING_CLIENT_ID/SECRET configurados, todas as funções caem
 * pra "modo dev" — não chamam a API e retornam null/erro tratável.
 */

const BLING_OAUTH_URL = "https://www.bling.com.br/Api/v3/oauth/token";
const BLING_API_BASE = "https://www.bling.com.br/Api/v3";

type TokenCache = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
};

let cache: TokenCache | null = null;

export function blingEnabled() {
  return Boolean(
    process.env.BLING_CLIENT_ID &&
      process.env.BLING_CLIENT_SECRET &&
      process.env.BLING_REFRESH_TOKEN
  );
}

async function refreshAccessToken(): Promise<TokenCache | null> {
  if (!blingEnabled()) return null;

  const refreshToken = cache?.refreshToken ?? process.env.BLING_REFRESH_TOKEN!;
  const basic = Buffer.from(
    `${process.env.BLING_CLIENT_ID}:${process.env.BLING_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(BLING_OAUTH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }).toString(),
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[bling] refresh token falhou:", res.status, text);
    return null;
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number; // segundos
  };

  if (data.refresh_token && data.refresh_token !== refreshToken) {
    console.warn(
      "[bling] refresh_token foi rotacionado. Atualize BLING_REFRESH_TOKEN no env."
    );
  }

  // Margem de segurança de 60s pra evitar usar token quase expirado.
  const expiresAt = Date.now() + (data.expires_in - 60) * 1000;
  cache = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt
  };
  return cache;
}

async function getAccessToken(): Promise<string | null> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.accessToken;
  }
  const fresh = await refreshAccessToken();
  return fresh?.accessToken ?? null;
}

export type BlingError = { ok: false; status: number; message: string };
export type BlingOk<T> = { ok: true; data: T };
export type BlingResponse<T> = BlingOk<T> | BlingError;

export async function blingFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<BlingResponse<T>> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, status: 0, message: "Bling não configurado." };
  }

  const url = `${BLING_API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  // 401 — tenta um refresh e refaz a request uma vez.
  if (res.status === 401) {
    cache = null;
    const fresh = await refreshAccessToken();
    if (!fresh) {
      return {
        ok: false,
        status: 401,
        message: "Não foi possível renovar o token Bling."
      };
    }
    const retry = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init.headers,
        Authorization: `Bearer ${fresh.accessToken}`
      },
      cache: "no-store"
    });
    return readResponse<T>(retry);
  }

  return readResponse<T>(res);
}

async function readResponse<T>(res: Response): Promise<BlingResponse<T>> {
  if (res.ok) {
    const data = (await res.json().catch(() => null)) as T;
    return { ok: true, data };
  }
  const text = await res.text().catch(() => "");
  let message = `HTTP ${res.status}`;
  try {
    const parsed = JSON.parse(text) as {
      error?: { message?: string; description?: string };
    };
    message =
      parsed.error?.message ?? parsed.error?.description ?? message;
  } catch {
    if (text) message = text.slice(0, 240);
  }
  return { ok: false, status: res.status, message };
}
