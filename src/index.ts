import { Hono } from "hono";
import type { AppEnv } from "./types";
import { authMiddleware } from "./auth";
import { renderNotFound } from "./templates";
import { authLink } from "./http";
import { registerAdminRoutes } from "./routes/admin";
import { registerMediaRoutes } from "./routes/media";
import { registerPublicRoutes } from "./routes/public";

const app = new Hono<AppEnv>();

app.use("*", authMiddleware());
app.use("*", async (c, next) => {
  await next();
  if (c.req.path.startsWith("/admin")) {
    return;
  }
  const existing = c.res.headers.get("Cache-Control");
  if (!existing) {
    const ttl = Number(c.env.CACHE_TTL_SECONDS ?? 120);
    c.res.headers.set("Cache-Control", `public, max-age=${ttl}`);
  }
});

registerPublicRoutes(app);
registerMediaRoutes(app);
registerAdminRoutes(app);

app.notFound(async (c) => c.html(await renderNotFound(c, authLink(c)), 404));

export default app;
