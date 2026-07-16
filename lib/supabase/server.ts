import { createClient } from "@supabase/supabase-js";

/**
 * This module is also imported by standalone Node validation/index scripts, so
 * Next's `server-only` marker cannot be used without breaking those entry
 * points. Keep an equivalent runtime boundary here and enforce the import
 * graph with a source-scan test.
 */
if (typeof window !== "undefined") {
  throw new Error("The Supabase service-role helper is server-only.");
}

export type SupabaseServerKeyType = "service_role" | "anon" | "unavailable";

type SupabaseEnvironment = Record<string, string | undefined>;

export type SupabaseServerCredential = {
  key_type: SupabaseServerKeyType;
  url?: string;
  service_role_key?: string;
  warning?: string;
};

export function resolveSupabaseServerCredential(
  env: Partial<SupabaseEnvironment> = process.env
): SupabaseServerCredential {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (url && serviceRoleKey) {
    return { key_type: "service_role", url, service_role_key: serviceRoleKey };
  }
  if (url && anonKey) {
    return {
      key_type: "anon",
      url,
      warning: "Only an anon Supabase key is configured. Server OKF reads require SUPABASE_SERVICE_ROLE_KEY; the anon key was not used."
    };
  }
  return {
    key_type: "unavailable",
    warning: url
      ? "SUPABASE_SERVICE_ROLE_KEY is not configured for server OKF reads."
      : "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for server OKF reads."
  };
}

/**
 * New sb_secret keys authenticate through apikey and must not be sent as a
 * Bearer JWT. Legacy service-role JWTs still need Authorization. Neither path
 * reads browser cookies or an auth session.
 */
export function serviceRoleRestHeaders(serviceRoleKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    apikey: serviceRoleKey
  };
  if (isJwt(serviceRoleKey)) headers.Authorization = `Bearer ${serviceRoleKey}`;
  return headers;
}

export function getSupabaseServiceRoleClient(
  env: Partial<SupabaseEnvironment> = process.env,
  fetchImpl: typeof fetch = fetch
) {
  const credential = resolveSupabaseServerCredential(env);
  if (credential.key_type !== "service_role" || !credential.url || !credential.service_role_key) {
    throw new Error("Missing Supabase service-role environment variables.");
  }
  return createClient(credential.url, credential.service_role_key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      fetch: serviceRoleClientFetch(credential.service_role_key, fetchImpl)
    }
  });
}

/**
 * Supabase JS currently supplies its client key as a Bearer token as well as
 * an apikey. That is correct for legacy JWT service-role keys, but modern
 * sb_secret keys are not JWTs and PostgREST must receive them only as apikey.
 */
export function serviceRoleClientFetch(
  serviceRoleKey: string,
  fetchImpl: typeof fetch = fetch
): typeof fetch {
  const jwt = isJwt(serviceRoleKey);
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
    headers.set("apikey", serviceRoleKey);
    if (jwt) headers.set("Authorization", `Bearer ${serviceRoleKey}`);
    else headers.delete("Authorization");

    return fetchImpl(input, {
      ...init,
      headers,
      credentials: "omit"
    });
  }) as typeof fetch;
}

function isJwt(value: string) {
  return value.split(".").length === 3;
}
