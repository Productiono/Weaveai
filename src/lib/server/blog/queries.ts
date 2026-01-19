import { and, desc, eq, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import {
  blogCategories,
  blogPosts,
  blogPostCategories,
  blogPostTags,
  blogTags,
  users
} from '$lib/server/db/schema.js';

const DEFAULT_PAGE_SIZE = 10;

function compactConditions<T>(conditions: Array<T | undefined>): T[] {
  return conditions.filter(Boolean) as T[];
}

export async function publishScheduledPosts(now: Date = new Date()): Promise<void> {
  await db
    .update(blogPosts)
    .set({
      status: 'published',
      publishedAt: sql`COALESCE(${blogPosts.scheduledFor}, ${now})`,
      scheduledFor: null,
      updatedAt: now
    })
    .where(and(eq(blogPosts.status, 'scheduled'), lte(blogPosts.scheduledFor, now)));
}

export async function getCategoryBySlug(slug: string) {
  const [category] = await db
    .select()
    .from(blogCategories)
    .where(eq(blogCategories.slug, slug));
  return category || null;
}

export async function getTagBySlug(slug: string) {
  const [tag] = await db
    .select()
    .from(blogTags)
    .where(eq(blogTags.slug, slug));
  return tag || null;
}

export async function getPublishedPosts(options: {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string | null;
  tagId?: string | null;
}) {
  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;
  const now = new Date();

  await publishScheduledPosts(now);

  const filters = compactConditions([
    eq(blogPosts.status, 'published'),
    lte(blogPosts.publishedAt, now),
    options.search
      ? or(
          ilike(blogPosts.title, `%${options.search}%`),
          ilike(blogPosts.excerpt, `%${options.search}%`),
          ilike(blogPosts.contentMarkdown, `%${options.search}%`)
        )
      : undefined,
    options.categoryId
      ? inArray(
          blogPosts.id,
          db
            .select({ postId: blogPostCategories.postId })
            .from(blogPostCategories)
            .where(eq(blogPostCategories.categoryId, options.categoryId))
        )
      : undefined,
    options.tagId
      ? inArray(
          blogPosts.id,
          db
            .select({ postId: blogPostTags.postId })
            .from(blogPostTags)
            .where(eq(blogPostTags.tagId, options.tagId))
        )
      : undefined
  ]);

  const posts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      featuredImageUrl: blogPosts.featuredImageUrl,
      publishedAt: blogPosts.publishedAt,
      readingTimeMinutes: blogPosts.readingTimeMinutes,
      authorName: users.name
    })
    .from(blogPosts)
    .leftJoin(users, eq(users.id, blogPosts.authorId))
    .where(and(...filters))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(pageSize)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(blogPosts)
    .where(and(...filters));

  return {
    posts,
    total: count || 0,
    page,
    pageSize
  };
}

export async function getPostBySlug(slug: string) {
  const now = new Date();

  await publishScheduledPosts(now);

  const [post] = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      contentHtml: blogPosts.contentHtml,
      contentMarkdown: blogPosts.contentMarkdown,
      featuredImageUrl: blogPosts.featuredImageUrl,
      publishedAt: blogPosts.publishedAt,
      readingTimeMinutes: blogPosts.readingTimeMinutes,
      metaTitle: blogPosts.metaTitle,
      metaDescription: blogPosts.metaDescription,
      authorId: blogPosts.authorId,
      authorName: users.name
    })
    .from(blogPosts)
    .leftJoin(users, eq(users.id, blogPosts.authorId))
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published'), lte(blogPosts.publishedAt, now)));

  return post || null;
}

export async function getPostById(id: string) {
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id));

  return post || null;
}

export async function getPostCategories(postIds: string[]) {
  if (!postIds.length) return new Map();

  const rows = await db
    .select({
      postId: blogPostCategories.postId,
      id: blogCategories.id,
      name: blogCategories.name,
      slug: blogCategories.slug
    })
    .from(blogPostCategories)
    .innerJoin(blogCategories, eq(blogCategories.id, blogPostCategories.categoryId))
    .where(inArray(blogPostCategories.postId, postIds));

  const map = new Map<string, Array<{ id: string; name: string; slug: string }>>();

  rows.forEach((row) => {
    if (!map.has(row.postId)) {
      map.set(row.postId, []);
    }
    map.get(row.postId)!.push({ id: row.id, name: row.name, slug: row.slug });
  });

  return map;
}

export async function getPostTags(postIds: string[]) {
  if (!postIds.length) return new Map();

  const rows = await db
    .select({
      postId: blogPostTags.postId,
      id: blogTags.id,
      name: blogTags.name,
      slug: blogTags.slug
    })
    .from(blogPostTags)
    .innerJoin(blogTags, eq(blogTags.id, blogPostTags.tagId))
    .where(inArray(blogPostTags.postId, postIds));

  const map = new Map<string, Array<{ id: string; name: string; slug: string }>>();

  rows.forEach((row) => {
    if (!map.has(row.postId)) {
      map.set(row.postId, []);
    }
    map.get(row.postId)!.push({ id: row.id, name: row.name, slug: row.slug });
  });

  return map;
}

export async function getAdminPosts(options: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string | null;
}) {
  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  const filters = compactConditions([
    options.status ? eq(blogPosts.status, options.status) : undefined,
    options.search
      ? or(
          ilike(blogPosts.title, `%${options.search}%`),
          ilike(blogPosts.excerpt, `%${options.search}%`)
        )
      : undefined
  ]);

  const posts = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      scheduledFor: blogPosts.scheduledFor,
      updatedAt: blogPosts.updatedAt,
      authorName: users.name
    })
    .from(blogPosts)
    .leftJoin(users, eq(users.id, blogPosts.authorId))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(blogPosts.updatedAt))
    .limit(pageSize)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(blogPosts)
    .where(filters.length ? and(...filters) : undefined);

  return {
    posts,
    total: count || 0,
    page,
    pageSize
  };
}

export async function getAllCategories() {
  return db.select().from(blogCategories).orderBy(blogCategories.name);
}

export async function getAllTags() {
  return db.select().from(blogTags).orderBy(blogTags.name);
}
