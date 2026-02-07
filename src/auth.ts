import { createClerkClient } from "@clerk/backend";
import { Context, Next } from "hono";
import { AppEnv, ClerkAuth } from "./types";

type Ctx = Context<AppEnv>;

export function authMiddleware() {
  return async (c: Ctx, next: Next) => {
    const secretKey = c.env.CLERK_SECRET_KEY;
    const publishableKey = c.env.CLERK_PUBLISHABLE_KEY;
    if (!secretKey || !publishableKey) {
      c.set("auth", null);
      return next();
    }
    const clerk = createClerkClient({ secretKey, publishableKey });
    try {
      const request =
        c.req.raw instanceof Request
          ? c.req.raw
          : new Request(c.req.url, { headers: c.req.header() });
      const auth = await clerk.authenticateRequest(request);
      if (auth.isSignedIn && auth.toAuth()) {
        const session = auth.toAuth().sessionClaims as Record<string, unknown> | undefined;
        const metadata = session?.metadata as Record<string, unknown> | undefined;
        const publicMetadata = session?.publicMetadata as Record<string, unknown> | undefined;
        const roleCandidate = metadata?.role ?? publicMetadata?.role;
        const role = roleCandidate === "admin" ? "admin" : "user";
        c.set("auth", { userId: (session?.sub as string) ?? "", role } as ClerkAuth);
      } else {
        c.set("auth", null);
      }
    } catch (e) {
      console.error("Clerk auth error", e);
      c.set("auth", null);
    }
    return next();
  };
}

export function requireAdmin(c: Ctx, fallback?: () => Response) {
  const auth = c.get("auth") as ClerkAuth | null;
  if (!auth || auth.role !== "admin") {
    return fallback ? fallback() : c.redirect("/");
  }
  return null;
}
