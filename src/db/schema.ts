import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clerkId: text("clerk_id").notNull().unique(),
  role: text("role").default("user"),
  createdAt: integer("created_at").default(sql`(strftime('%s','now'))`),
  updatedAt: integer("updated_at").default(sql`(strftime('%s','now'))`),
});

export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uid: text("uid").notNull().unique(),
  type: text("type", { enum: ["video", "audio"] }).notNull(),
  number: integer("number"),
  category: text("category"),
  title: text("title").notNull(),
  description: text("description"),
  keywords: text("keywords"),
  streamUrl: text("stream_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  featured: integer("featured").default(0),
  published: integer("published").default(1),
  createdAt: integer("created_at").default(sql`(strftime('%s','now'))`),
  updatedAt: integer("updated_at").default(sql`(strftime('%s','now'))`),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const mediaTags = sqliteTable(
  "media_tags",
  {
    mediaId: integer("media_id").notNull().references(() => media.id, {
      onDelete: "cascade",
    }),
    tagId: integer("tag_id").notNull().references(() => tags.id, {
      onDelete: "cascade",
    }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.mediaId, table.tagId] }),
  })
);

export const siteContent = sqliteTable("site_content", {
  key: text("key").primaryKey(),
  value: text("value"),
});
