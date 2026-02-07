import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const drizzleDir = path.resolve("drizzle");
const wranglerMigrationsDir = path.resolve("migrations");

await mkdir(wranglerMigrationsDir, { recursive: true });

const entries = await readdir(drizzleDir, { withFileTypes: true });

for (const entry of entries) {
  if (entry.name === "meta") continue;

  if (entry.isDirectory()) {
    const migrationSqlPath = path.join(drizzleDir, entry.name, "migration.sql");
    const outPath = path.join(wranglerMigrationsDir, `${entry.name}.sql`);
    try {
      const sql = await readFile(migrationSqlPath, "utf8");
      await writeFile(outPath, sql, { flag: "wx" });
      console.log(`Created ${path.relative(process.cwd(), outPath)}`);
    } catch (err) {
      if (err && err.code === "EEXIST") {
        continue;
      }
      throw err;
    }
    continue;
  }

  if (entry.isFile() && entry.name.endsWith(".sql")) {
    const migrationSqlPath = path.join(drizzleDir, entry.name);
    const outPath = path.join(wranglerMigrationsDir, entry.name);
    try {
      const sql = await readFile(migrationSqlPath, "utf8");
      await writeFile(outPath, sql, { flag: "wx" });
      console.log(`Created ${path.relative(process.cwd(), outPath)}`);
    } catch (err) {
      if (err && err.code === "EEXIST") {
        continue;
      }
      throw err;
    }
  }
}
