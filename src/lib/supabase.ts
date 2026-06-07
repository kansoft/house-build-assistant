import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";

export function createClient(requestHeaders: Headers, cookies: AstroCookies, authResponseHeaders?: Headers) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(requestHeaders.get("Cookie") ?? "").map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options);
        });
        // On token refresh @supabase/ssr emits no-cache headers (Cache-Control/Expires/Pragma)
        // that must reach the response, or a CDN could cache the Set-Cookie and authenticate the
        // wrong user. The middleware applies the collected headers to the outgoing response.
        if (authResponseHeaders) {
          Object.entries(headers).forEach(([key, value]) => {
            authResponseHeaders.set(key, value);
          });
        }
      },
    },
  });
}
