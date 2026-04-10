import { db, Product, sql } from "astro:db";

function isMissingColumn(error: unknown, column: string): boolean {
  if (!(error instanceof Error)) return false;
  const m = error.message.toLowerCase();
  return m.includes(`no such column: ${column}`) || m.includes(`no column named ${column}`);
}

export const isMissingRecipeColumnError   = (e: unknown) => isMissingColumn(e, 'recipe');
export const isMissingFeaturedColumnError = (e: unknown) => isMissingColumn(e, 'featured');

function isDuplicateColumnError(error: unknown, column: string): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.toLowerCase().includes(`duplicate column name: ${column}`);
}

let featuredColumnReady: Promise<void> | null = null;

export async function ensureFeaturedColumnExists() {
  if (!featuredColumnReady) {
    featuredColumnReady = (async () => {
      try {
        await db.run(sql`SELECT featured FROM ${Product} LIMIT 1`);
      } catch (error) {
        if (!isMissingFeaturedColumnError(error)) {
          throw error;
        }

        try {
          await db.run(sql`ALTER TABLE ${Product} ADD COLUMN featured INTEGER DEFAULT 0`);
        } catch (alterError) {
          if (!isDuplicateColumnError(alterError, 'featured')) {
            throw alterError;
          }
        }
      }
    })().catch((error) => {
      featuredColumnReady = null;
      throw error;
    });
  }

  await featuredColumnReady;
}
