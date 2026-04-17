import { db, Product, ProductImage, sql } from "astro:db";

function isMissingColumn(error: unknown, column: string): boolean {
  if (!(error instanceof Error)) return false;
  const m = error.message.toLowerCase();
  const col = column.toLowerCase();
  return m.includes(`no such column: ${col}`) || m.includes(`no column named ${col}`);
}

export const isMissingRecipeColumnError    = (e: unknown) => isMissingColumn(e, 'recipe');
export const isMissingFeaturedColumnError  = (e: unknown) => isMissingColumn(e, 'featured');
export const isMissingIsEnabledColumnError = (e: unknown) => isMissingColumn(e, 'isEnabled');
export const isMissingSortOrderColumnError = (e: unknown) => isMissingColumn(e, 'sortOrder');
export const isMissingIsCardColumnError    = (e: unknown) => isMissingColumn(e, 'isCard');

function isDuplicateColumnError(error: unknown, column: string): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.toLowerCase().includes(`duplicate column name: ${column}`);
}

let featuredColumnReady: Promise<void> | null = null;
let isEnabledColumnReady: Promise<void> | null = null;
let imageMetaColumnsReady: Promise<void> | null = null;

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

export async function ensureIsEnabledColumnExists() {
  if (!isEnabledColumnReady) {
    isEnabledColumnReady = (async () => {
      try {
        await db.run(sql`SELECT isEnabled FROM ${Product} LIMIT 1`);
      } catch (error) {
        if (!isMissingIsEnabledColumnError(error)) {
          throw error;
        }

        try {
          await db.run(sql`ALTER TABLE ${Product} ADD COLUMN isEnabled INTEGER DEFAULT 1`);
        } catch (alterError) {
          if (!isDuplicateColumnError(alterError, 'isEnabled')) {
            throw alterError;
          }
        }
      }
    })().catch((error) => {
      isEnabledColumnReady = null;
      throw error;
    });
  }

  await isEnabledColumnReady;
}

export async function ensureImageMetaColumnsExist() {
  if (!imageMetaColumnsReady) {
    imageMetaColumnsReady = (async () => {
      try {
        await db.run(sql`SELECT sortOrder FROM ${ProductImage} LIMIT 1`);
      } catch (error) {
        if (!isMissingSortOrderColumnError(error)) throw error;
        try {
          await db.run(sql`ALTER TABLE ${ProductImage} ADD COLUMN sortOrder INTEGER`);
        } catch (e) {
          if (!isDuplicateColumnError(e, 'sortOrder')) throw e;
        }
      }

      try {
        await db.run(sql`SELECT isCard FROM ${ProductImage} LIMIT 1`);
      } catch (error) {
        if (!isMissingIsCardColumnError(error)) throw error;
        try {
          await db.run(sql`ALTER TABLE ${ProductImage} ADD COLUMN isCard INTEGER DEFAULT 0`);
        } catch (e) {
          if (!isDuplicateColumnError(e, 'isCard')) throw e;
        }
      }
    })().catch((error) => {
      imageMetaColumnsReady = null;
      throw error;
    });
  }

  await imageMetaColumnsReady;
}
