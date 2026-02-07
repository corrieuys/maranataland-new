import { Hono } from "hono";
import type { AppEnv } from "../types";
import { listLatestMedia } from "../db";
import { withCache } from "../cache";
import { authLink, cacheKey } from "../http";
import { renderHome, renderHomeLatest, renderStaticPage } from "../templates";
import { ROUTES } from "./paths";

export function registerPublicRoutes(app: Hono<AppEnv>) {
  app.get(ROUTES.home, async (c) =>
    withCache(c, cacheKey(c, "home"), async () =>
      c.html(await renderHome(c, authLink(c)))
    )
  );

  app.get("/_fragments/home-latest", async (c) => {
    const latestVideos = await listLatestMedia(c.env.DB, "video", 8);
    const latestAudio = await listLatestMedia(c.env.DB, "audio", 8);
    return c.html(await renderHomeLatest(c, latestVideos, latestAudio));
  });

  app.get(ROUTES.contact, async (c) =>
    c.html(await renderStaticPage(c, "contact", "Kontak", authLink(c)))
  );
  app.get(ROUTES.shop, async (c) =>
    c.html(await renderStaticPage(c, "shop", "Winkel", authLink(c)))
  );
  app.get(ROUTES.terms, async (c) =>
    c.html(await renderStaticPage(c, "terms", "Terme", authLink(c)))
  );
}
