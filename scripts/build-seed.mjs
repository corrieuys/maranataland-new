import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = path.resolve("data");
const outPath = path.join(dataDir, "seed.sql");

const videoPath = path.join(dataDir, "videoImport.json");
const audioPath = path.join(dataDir, "audioImport.json");

const [videoRaw, audioRaw] = await Promise.all([
  readFile(videoPath, "utf8"),
  readFile(audioPath, "utf8"),
]);

const videos = JSON.parse(videoRaw);
const audios = JSON.parse(audioRaw);

const slugify = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const sqlValue = (value) => {
  if (value === undefined || value === null) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? `${value}` : "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
};

const parseIntOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : Math.trunc(parsed);
};

const buildUid = (item, index, typeFallback) => {
  if (item.uid) return String(item.uid);
  const type = item.type ?? typeFallback ?? "media";
  const number = parseIntOrNull(item.number);
  const title = slugify(item.title);
  const base = [type, number ?? `i${index}`].join("-");
  return title ? `${base}-${title}` : base;
};

const normalizeNullableString = (value) =>
  value === undefined || value === null || value === "" ? null : String(value);

const normalizeItem = (item, index, typeFallback) => {
  const type = item.type ?? typeFallback;
  return {
    uid: buildUid(item, index, type),
    type,
    number: parseIntOrNull(item.number),
    category: normalizeNullableString(item.category),
    title: String(item.title ?? ""),
    description: normalizeNullableString(item.description),
    keywords: normalizeNullableString(item.keywords),
    stream_url: String(item.streamUrl ?? item.stream_url ?? ""),
    thumbnail_url: normalizeNullableString(
      item.thumbnailUrl ?? item.thumbnail_url
    ),
    featured: 0,
    published: 1,
  };
};

const rows = [
  ...videos.map((item, index) => normalizeItem(item, index + 1, "video")),
  ...audios.map((item, index) => normalizeItem(item, index + 1, "audio")),
];

const columns = [
  "uid",
  "type",
  "number",
  "category",
  "title",
  "description",
  "keywords",
  "stream_url",
  "thumbnail_url",
  "featured",
  "published",
];

const valuesSql = rows
  .map((row) =>
    `(${columns.map((col) => sqlValue(row[col])).join(", ")})`
  )
  .join(",\n");

const output = `-- Auto-generated from data/videoImport.json and data/audioImport.json
BEGIN TRANSACTION;
INSERT INTO media (${columns.join(", ")})
VALUES
${valuesSql};
COMMIT;
`;

await writeFile(outPath, output, "utf8");
console.log(`Wrote ${path.relative(process.cwd(), outPath)} (${rows.length} rows).`);
