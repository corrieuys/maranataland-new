import { Context, Hono } from "hono";
import type { AppEnv, MediaType } from "../types";
import { countMedia, getMediaByUid, listMediaPaged } from "../db";
import { withCache } from "../cache";
import { authLink, cacheKey, isHtmx } from "../http";
import {
  renderDetailPage,
  renderMediaListContent,
  renderListPage,
  renderNotFound,
} from "../templates";
import { ROUTES } from "./paths";

const renderMediaList = async (
  c: Context<AppEnv>,
  type: MediaType,
  title: string,
  typePath: string
) => {
  const category = c.req.query("category");
  const page = Math.max(1, Number(c.req.query("page") ?? "1") || 1);
  const pageSize = type === "audio" ? 10 : 12;
  const [{ items, hasNext }, totalCount] = await Promise.all([
    listMediaPaged(c.env.DB, {
      type,
      category,
      page,
      pageSize,
    }),
    countMedia(c.env.DB, { type, category }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagination = buildPagination({
    page: currentPage,
    totalPages,
    hasNext,
    basePath: typePath,
    category,
  });

  if (isHtmx(c)) {
    return c.html(
      await renderMediaListContent(c, {
        items,
        pagination,
        layout: type === "audio" ? "list" : "grid",
      })
    );
  }
  return withCache(c, cacheKey(c, typePath), async () =>
    c.html(
      await renderListPage(c, {
        title,
        items,
        typePath,
        category,
        pagination,
        authLink: authLink(c),
      })
    )
  );
};

const buildPagination = (input: {
  page: number;
  totalPages: number;
  hasNext: boolean;
  basePath: string;
  category?: string | null;
}) => {
  const paramsFor = (page: number) => {
    const params = new URLSearchParams();
    if (input.category) params.set("category", input.category);
    if (page > 1) params.set("page", String(page));
    return params.toString();
  };

  const link = (page: number, label: string, disabled: boolean) => {
    const qs = paramsFor(page);
    const href = qs ? `${input.basePath}?${qs}` : input.basePath;
    const classes = disabled
      ? "pointer-events-none opacity-40"
      : "hover:underline";
    return `<a class="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 ${classes}" href="${href}" hx-get="${href}" hx-target="#media-list" hx-swap="outerHTML" hx-push-url="true">${label}</a>`;
  };

  const prev = input.page > 1 ? link(input.page - 1, "← Vorige", false) : link(1, "← Vorige", true);
  const next = input.hasNext ? link(input.page + 1, "Volgende →", false) : link(input.page + 1, "Volgende →", true);

  const windowSize = 5;
  const start = Math.max(1, input.page - Math.floor(windowSize / 2));
  const end = Math.min(input.totalPages, start + windowSize - 1);
  const pageLinks: string[] = [];
  for (let p = start; p <= end; p++) {
    const qs = paramsFor(p);
    const href = qs ? `${input.basePath}?${qs}` : input.basePath;
    const isCurrent = p === input.page;
    pageLinks.push(
      `<a class="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${isCurrent ? "bg-teal-700 text-white" : "text-teal-700 hover:bg-teal-50"}" href="${href}" hx-get="${href}" hx-target="#media-list" hx-swap="outerHTML" hx-push-url="true">${p}</a>`
    );
  }

  const center = `<div class="flex items-center gap-2">${pageLinks.join("")}</div>`;
  const full = `<div class="grid grid-cols-3 items-center gap-6">
    <div class="justify-self-start">${prev}</div>
    <div class="justify-self-center">${center}</div>
    <div class="justify-self-end">${next}</div>
  </div>`;
  return `<div class="mt-6 mb-10 px-2 sm:px-0">${full}</div>`;
};

const renderMediaDetail = async (c: Context<AppEnv>, type: MediaType) => {
  const uid = c.req.param("uid");
  const item = await getMediaByUid(c.env.DB, uid);
  if (!item || !item.published || item.type !== type) {
    return c.html(await renderNotFound(c, authLink(c)), 404);
  }
  return c.html(await renderDetailPage(c, item, authLink(c)));
};

export function registerMediaRoutes(app: Hono<AppEnv>) {
  app.get(ROUTES.videos, (c) =>
    renderMediaList(c, "video", "Videos", ROUTES.videos)
  );
  app.get(ROUTES.audio, (c) =>
    renderMediaList(c, "audio", "Luister", ROUTES.audio)
  );
  app.get(`${ROUTES.videos}/:uid`, (c) => renderMediaDetail(c, "video"));
  app.get(`${ROUTES.audio}/:uid`, (c) => renderMediaDetail(c, "audio"));
}
