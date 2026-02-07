import { Hono } from "hono";
import type { AppEnv, MediaImportItem } from "../types";
import { requireAdmin } from "../auth";
import { getMediaByUid, importFromJson, listMedia, upsertMedia } from "../db";
import { authLink, parseMediaFormData } from "../http";
import {
  renderAdminEdit,
  renderAdminList,
  renderAdminNew,
  renderNotFound,
} from "../templates";
import videoImport from "../../data/videoImport.json";
import audioImport from "../../data/audioImport.json";
import { ROUTES } from "./paths";

export function registerAdminRoutes(app: Hono<AppEnv>) {
  app.get(ROUTES.admin, async (c) => {
    const denied = requireAdmin(c);
    if (denied) return denied;
    const media = await listMedia(c.env.DB, undefined, {
      includeUnpublished: true,
    });
    return c.html(await renderAdminList(c, media, authLink(c)));
  });

  app.get(ROUTES.adminNew, async (c) => {
    const denied = requireAdmin(c);
    if (denied) return denied;
    return c.html(await renderAdminNew(c, authLink(c)));
  });

  app.get(`${ROUTES.adminEdit}/:uid`, async (c) => {
    const denied = requireAdmin(c);
    if (denied) return denied;
    const uid = c.req.param("uid");
    const item = await getMediaByUid(c.env.DB, uid);
    if (!item) return c.html(await renderNotFound(c, authLink(c)), 404);
    return c.html(await renderAdminEdit(c, item, authLink(c)));
  });

  app.post(ROUTES.adminImport, async (c) => {
    const denied = requireAdmin(c);
    if (denied) return denied;
    await importFromJson(c.env.DB, videoImport as MediaImportItem[], "video");
    await importFromJson(c.env.DB, audioImport as MediaImportItem[], "audio");
    return c.redirect(ROUTES.admin);
  });

  app.post(ROUTES.adminNew, async (c) => {
    const denied = requireAdmin(c);
    if (denied) return denied;
    const data = await c.req.parseBody();
    const item = parseMediaFormData(data);
    await upsertMedia(c.env.DB, item);
    return c.redirect(ROUTES.admin);
  });

  app.post(`${ROUTES.adminEdit}/:uid`, async (c) => {
    const denied = requireAdmin(c);
    if (denied) return denied;
    const data = await c.req.parseBody();
    const uid = c.req.param("uid");
    const item = parseMediaFormData(data, { uid });
    await upsertMedia(c.env.DB, item);
    return c.redirect(ROUTES.admin);
  });
}
