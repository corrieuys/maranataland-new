import { MediaImportItem, MediaItem, MediaType } from "./types";

export async function listMedia(
  db: D1Database,
  type?: MediaType,
  options: {
    featuredOnly?: boolean;
    category?: string | null;
    includeUnpublished?: boolean;
  } = {}
): Promise<MediaItem[]> {
  const clauses: string[] = [];
  const binds: (string | number)[] = [];

  if (type) {
    clauses.push("type = ?");
    binds.push(type);
  }
  if (options.featuredOnly) {
    clauses.push("featured = 1");
  }
  if (options.category) {
    clauses.push("category = ?");
    binds.push(options.category);
  }
  if (!options.includeUnpublished) {
    clauses.push("published = 1");
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const stmt = db.prepare(
    `SELECT * FROM media ${where} ORDER BY created_at DESC, id DESC`
  ).bind(...binds);
  const { results } = await stmt.all<MediaItem>();
  return results ?? [];
}

export async function listMediaPaged(
  db: D1Database,
  input: {
    type: MediaType;
    category?: string | null;
    page: number;
    pageSize: number;
  }
): Promise<{ items: MediaItem[]; hasNext: boolean }> {
  const clauses: string[] = ["type = ?", "published = 1"];
  const binds: (string | number)[] = [input.type];

  if (input.category) {
    clauses.push("category = ?");
    binds.push(input.category);
  }

  const offset = (input.page - 1) * input.pageSize;
  const where = `WHERE ${clauses.join(" AND ")}`;
  const stmt = db
    .prepare(
      `SELECT * FROM media ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`
    )
    .bind(...binds, input.pageSize + 1, offset);
  const { results } = await stmt.all<MediaItem>();
  const items = (results ?? []).slice(0, input.pageSize);
  return { items, hasNext: (results?.length ?? 0) > input.pageSize };
}

export async function countMedia(
  db: D1Database,
  input: { type: MediaType; category?: string | null }
): Promise<number> {
  const clauses: string[] = ["type = ?", "published = 1"];
  const binds: (string | number)[] = [input.type];
  if (input.category) {
    clauses.push("category = ?");
    binds.push(input.category);
  }
  const where = `WHERE ${clauses.join(" AND ")}`;
  const stmt = db
    .prepare(`SELECT COUNT(1) as count FROM media ${where}`)
    .bind(...binds);
  const { results } = await stmt.all<{ count: number }>();
  return results?.[0]?.count ?? 0;
}

export async function listLatestMedia(
  db: D1Database,
  type: MediaType,
  limit = 8
): Promise<MediaItem[]> {
  const stmt = db
    .prepare(
      `SELECT * FROM media WHERE type = ? AND published = 1 ORDER BY created_at DESC, id DESC LIMIT ?`
    )
    .bind(type, limit);
  const { results } = await stmt.all<MediaItem>();
  return results ?? [];
}

export async function getMediaByUid(db: D1Database, uid: string) {
  const { results } = await db
    .prepare("SELECT * FROM media WHERE uid = ? LIMIT 1")
    .bind(uid)
    .all<MediaItem>();
  return results?.[0] ?? null;
}

export async function upsertMedia(db: D1Database, item: MediaItem) {
  const existing = await getMediaByUid(db, item.uid);
  if (existing) {
    await db
      .prepare(
        `UPDATE media SET type=?, number=?, category=?, title=?, description=?, keywords=?, stream_url=?, thumbnail_url=?, featured=?, published=?, updated_at=strftime('%s','now') WHERE uid=?`
      )
      .bind(
        item.type,
        item.number ?? null,
        item.category ?? null,
        item.title,
        item.description ?? null,
        item.keywords ?? null,
        item.stream_url,
        item.thumbnail_url ?? null,
        item.featured ? 1 : 0,
        item.published ? 1 : 0,
        item.uid
      )
      .run();
    return;
  }

  await db
    .prepare(
      `INSERT INTO media (uid, type, number, category, title, description, keywords, stream_url, thumbnail_url, featured, published) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(
      item.uid,
      item.type,
      item.number ?? null,
      item.category ?? null,
      item.title,
      item.description ?? null,
      item.keywords ?? null,
      item.stream_url,
      item.thumbnail_url ?? null,
      item.featured ? 1 : 0,
      item.published ? 1 : 0
    )
    .run();
}

const normalizeNumber = (value: unknown) => {
  if (value === "" || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export async function importFromJson(
  db: D1Database,
  items: MediaImportItem[],
  type: MediaType
) {
  for (const item of items) {
    await upsertMedia(db, {
      uid: item.uid,
      type,
      title: item.title,
      description: item.description ?? null,
      category: item.category ?? null,
      keywords: item.keywords ?? null,
      stream_url: item.streamUrl ?? item.stream_url ?? "",
      thumbnail_url: item.thumbnailUrl ?? item.thumbnail_url ?? null,
      featured: Boolean(item.featured),
      published: item.published !== false,
      number: normalizeNumber(item.number),
    });
  }
}
