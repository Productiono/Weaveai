import { eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import {
  blogCategories,
  blogPostCategories,
  blogPostTags,
  blogTags
} from '$lib/server/db/schema.js';
import { ensureValidSlug, slugify } from './slug.js';

function normalizeList(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

export async function ensureCategories(categoryNames: string[]) {
  const names = normalizeList(categoryNames);
  if (!names.length) return [];

  const slugs = names.map((name) => ensureValidSlug(slugify(name)));

  const existing = await db
    .select()
    .from(blogCategories)
    .where(inArray(blogCategories.slug, slugs));

  const existingBySlug = new Map(existing.map((category) => [category.slug, category]));

  const toInsert = names
    .map((name, index) => ({
      name,
      slug: slugs[index]
    }))
    .filter((category) => !existingBySlug.has(category.slug));

  if (toInsert.length) {
    const inserted = await db.insert(blogCategories).values(toInsert).returning();
    inserted.forEach((category) => existingBySlug.set(category.slug, category));
  }

  return slugs
    .map((slug) => existingBySlug.get(slug))
    .filter(Boolean);
}

export async function ensureTags(tagNames: string[]) {
  const names = normalizeList(tagNames);
  if (!names.length) return [];

  const slugs = names.map((name) => ensureValidSlug(slugify(name)));

  const existing = await db
    .select()
    .from(blogTags)
    .where(inArray(blogTags.slug, slugs));

  const existingBySlug = new Map(existing.map((tag) => [tag.slug, tag]));

  const toInsert = names
    .map((name, index) => ({
      name,
      slug: slugs[index]
    }))
    .filter((tag) => !existingBySlug.has(tag.slug));

  if (toInsert.length) {
    const inserted = await db.insert(blogTags).values(toInsert).returning();
    inserted.forEach((tag) => existingBySlug.set(tag.slug, tag));
  }

  return slugs
    .map((slug) => existingBySlug.get(slug))
    .filter(Boolean);
}

export async function syncPostCategories(postId: string, categoryIds: string[]) {
  await db.delete(blogPostCategories).where(eq(blogPostCategories.postId, postId));

  if (!categoryIds.length) return;

  await db.insert(blogPostCategories).values(
    categoryIds.map((categoryId) => ({
      postId,
      categoryId
    }))
  );
}

export async function syncPostTags(postId: string, tagIds: string[]) {
  await db.delete(blogPostTags).where(eq(blogPostTags.postId, postId));

  if (!tagIds.length) return;

  await db.insert(blogPostTags).values(
    tagIds.map((tagId) => ({
      postId,
      tagId
    }))
  );
}

export function parseCommaList(value: FormDataEntryValue | null): string[] {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}
