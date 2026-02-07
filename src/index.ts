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

registerPublicRoutes(app);
registerMediaRoutes(app);
registerAdminRoutes(app);

app.notFound(async (c) => c.html(await renderNotFound(c, authLink(c)), 404));

export default app;
