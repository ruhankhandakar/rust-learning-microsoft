import { promises as fs } from "fs";
import path from "path";
import { Migrator, FileMigrationProvider } from "kysely";
import { db } from "./index";

async function migrate() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, "migrations"),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((r) => {
    if (r.status === "Success") {
      console.log(`✓ ${r.migrationName}`);
    } else if (r.status === "Error") {
      console.error(`✗ ${r.migrationName}`);
    }
  });

  if (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  if (!results?.length) {
    console.log("No new migrations to run.");
  }

  await db.destroy();
}

migrate();
