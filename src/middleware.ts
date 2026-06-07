import { defineMiddleware } from "astro:middleware";
import { createClient } from "@/lib/supabase";

const PROTECTED_ROUTES = ["/dashboard"];

export const onRequest = defineMiddleware(async (context, next) => {
  const authResponseHeaders = new Headers();
  const supabase = createClient(context.request.headers, context.cookies, authResponseHeaders);

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    context.locals.user = user ?? null;
  } else {
    context.locals.user = null;
  }

  if (PROTECTED_ROUTES.some((route) => context.url.pathname.startsWith(route))) {
    if (!context.locals.user) {
      return context.redirect("/auth/signin");
    }
  }

  const response = await next();

  // Forward the no-cache headers Supabase emits on token refresh so a CDN never caches a
  // Set-Cookie and serves one user's session to another (per-user isolation guardrail).
  authResponseHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  // Belt-and-suspenders: authenticated responses must never be cached, even without a refresh.
  if (context.locals.user) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
});
