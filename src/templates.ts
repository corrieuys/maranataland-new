import { Context } from "hono";
import { AppEnv, MediaItem } from "./types";
import { applyVars, escapeHtml, youtubeEmbedUrl } from "./templates/utils";

type TemplateCacheEntry = {
  value: string;
  expiresAt: number;
};

const templateCache = new Map<string, TemplateCacheEntry>();
const now = () => Math.floor(Date.now() / 1000);


async function loadTemplate(
  c: Context<AppEnv>,
  name: string
) {
  const ttl = Number(c.env.TEMPLATE_CACHE_TTL_SECONDS ?? 300);
  const cached = templateCache.get(name);
  if (cached && cached.expiresAt > now()) return cached.value;
  const url = new URL(`/templates/${name}.html`, c.req.url);
  const res = await c.env.ASSETS.fetch(url.toString());
  const text = await res.text();
  templateCache.set(name, { value: text, expiresAt: now() + ttl });
  return text;
}

async function renderCard(c: Context<AppEnv>, item: MediaItem) {
  const tpl = await loadTemplate(
    c,
    item.type === "audio" ? "card_audio" : "card"
  );
  const thumb =
    item.thumbnail_url ||
    (item.type === "audio" ? "/story_thumb.jpg" : "/ResizerImage353X499.jpg");
  const featured = item.featured
    ? `<span class="inline-flex items-center rounded-full bg-amber-400 text-slate-900 text-xs font-semibold px-2 py-1">Nuut</span>`
    : "";
  const category = "";
  const description = escapeHtml(item.description ?? "").slice(0, 120);
  const link = `/${item.type === "video" ? "videos" : "audio"}/${item.uid}`;
  return applyVars(tpl, {
    thumb: escapeHtml(thumb),
    title: escapeHtml(item.title),
    description,
    link,
    featured_badge: featured,
    category_badge: category,
  });
}

export async function renderGrid(c: Context<AppEnv>, items: MediaItem[]) {
  const cards = await Promise.all(items.map((item) => renderCard(c, item)));
  return cards.join("") || `<p class="text-slate-600">Geen items nie.</p>`;
}

export async function renderLayout(
  c: Context<AppEnv>,
  opts: { title: string; body: string; authLink: string }
) {
  const tpl = await loadTemplate(c, "layout");
  return applyVars(tpl, {
    title: escapeHtml(opts.title),
    body: opts.body,
    year: String(new Date().getFullYear()),
    auth_link: opts.authLink,
  });
}

export async function renderHome(
  c: Context<AppEnv>,
  authLink: string
) {
  const tpl = await loadTemplate(c, "home");
  const body = applyVars(tpl, {});
  return renderLayout(c, { title: "Kinderklub", body, authLink });
}

export async function renderHomeLatest(
  c: Context<AppEnv>,
  latestVideos: MediaItem[],
  latestAudio: MediaItem[]
) {
  const tpl = await loadTemplate(c, "home_latest");
  return applyVars(tpl, {
    latest_videos: await renderGrid(c, latestVideos),
    latest_audio: await renderGrid(c, latestAudio),
  });
}

export async function renderListPage(
  c: Context<AppEnv>,
  opts: {
    title: string;
    items: MediaItem[];
    typePath: string;
    category?: string | null;
    pagination: string;
    authLink: string;
  }
) {
  const tpl = await loadTemplate(
    c,
    opts.typePath === "/audio" ? "list_audio" : "list"
  );
  const categoryOptions = [
    `<option value="">Alle</option>`,
    `<option value="story"${opts.category === "story" ? " selected" : ""}>Stories</option>`,
    `<option value="film"${opts.category === "film" ? " selected" : ""}>Flieks</option>`,
  ].join("");
  const body = applyVars(tpl, {
    title: escapeHtml(opts.title),
    type_path: opts.typePath,
    category_options: categoryOptions,
    media_list: await renderMediaListContent(c, {
      items: opts.items,
      pagination: opts.pagination,
      layout: opts.typePath === "/audio" ? "list" : "grid",
    }),
  });
  return renderLayout(c, { title: opts.title, body, authLink: opts.authLink });
}

export async function renderMediaListContent(
  c: Context<AppEnv>,
  input: {
    items: MediaItem[];
    pagination?: string;
    layout: "grid" | "list";
  }
) {
  const gridClass =
    input.layout === "list"
      ? "flex flex-col gap-4"
      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4";
  const top = input.pagination ?? "";
  return `<div id="media-list">${top}<div id="media-grid" class="${gridClass}">${await renderGrid(
    c,
    input.items
  )}</div></div>`;
}

export async function renderDetailPage(
  c: Context<AppEnv>,
  item: MediaItem,
  authLink: string
) {
  const tpl = await loadTemplate(
    c,
    item.type === "audio" ? "detail_audio" : "detail"
  );
  const body = applyVars(tpl, {
    title: escapeHtml(item.title),
    description: escapeHtml(item.description ?? ""),
    embed_url: youtubeEmbedUrl(item.stream_url),
    audio_url: escapeHtml(item.stream_url),
  });
  return renderLayout(c, { title: item.title, body, authLink });
}

export async function renderStaticPage(
  c: Context<AppEnv>,
  name: "contact" | "shop" | "terms",
  title: string,
  authLink: string
) {
  const body = await loadTemplate(c, name);
  return renderLayout(c, { title, body, authLink });
}

export async function renderAdminList(
  c: Context<AppEnv>,
  items: MediaItem[],
  authLink: string
) {
  const tpl = await loadTemplate(c, "admin_list");
  const rows =
    items
      .map(
        (m) => `<tr>
          <td class="px-4 py-3">${escapeHtml(m.uid)}</td>
          <td class="px-4 py-3">${escapeHtml(m.type)}</td>
          <td class="px-4 py-3">${escapeHtml(m.title)}</td>
          <td class="px-4 py-3">${m.published ? "ja" : "nee"}</td>
          <td class="px-4 py-3"><a class="text-teal-700 font-semibold hover:underline" href="/admin/edit/${m.uid}">Wysig</a></td>
        </tr>`
      )
      .join("") || `<tr><td class="px-4 py-3 text-slate-600" colspan="5">Geen items nie.</td></tr>`;
  const body = applyVars(tpl, { rows });
  return renderLayout(c, { title: "Admin", body, authLink });
}

export async function renderAdminNew(c: Context<AppEnv>, authLink: string) {
  const body = await loadTemplate(c, "admin_new");
  return renderLayout(c, { title: "Nuwe Media", body, authLink });
}

export async function renderAdminEdit(
  c: Context<AppEnv>,
  item: MediaItem,
  authLink: string
) {
  const tpl = await loadTemplate(c, "admin_edit");
  const body = applyVars(tpl, {
    uid: escapeHtml(item.uid),
    title: escapeHtml(item.title),
    stream_url: escapeHtml(item.stream_url),
    thumbnail_url: escapeHtml(item.thumbnail_url ?? ""),
    category: escapeHtml(item.category ?? ""),
    number: escapeHtml(String(item.number ?? "")),
    keywords: escapeHtml(item.keywords ?? ""),
    featured_checked: item.featured ? "checked" : "",
    published_checked: item.published ? "checked" : "",
    type_video: item.type === "video" ? " selected" : "",
    type_audio: item.type === "audio" ? " selected" : "",
  });
  return renderLayout(c, { title: "Wysig Media", body, authLink });
}

export async function renderNotFound(c: Context<AppEnv>, authLink: string) {
  const body = await loadTemplate(c, "not_found");
  return renderLayout(c, { title: "404", body, authLink });
}
