import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db/index.js';
import { blogPosts } from '$lib/server/db/schema.js';
import { sanitizeFormInput } from '$lib/utils/sanitization.js';
import { renderMarkdown } from '$lib/server/blog/markdown.js';
import { calculateReadingTimeMinutes } from '$lib/server/blog/reading-time.js';
import { ensureValidSlug, slugify } from '$lib/server/blog/slug.js';
import { ensureCategories, ensureTags, parseCommaList, syncPostCategories, syncPostTags } from '$lib/server/blog/admin.js';
import { getAllCategories, getAllTags } from '$lib/server/blog/queries.js';
import { like } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

const PostSchema = z.object({
  title: z.string().min(3),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  contentMarkdown: z.string().min(1),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']),
  featuredImageUrl: z.string().url().optional().or(z.literal('')),
  scheduledFor: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
});

function resolveUniqueSlug(baseSlug: string, existingSlugs: string[]) {
  const normalizedExisting = new Set(existingSlugs);
  if (!normalizedExisting.has(baseSlug)) {
    return baseSlug;
  }

  let maxSuffix = 1;
  existingSlugs.forEach((slug) => {
    if (!slug.startsWith(`${baseSlug}-`)) return;
    const suffix = Number(slug.slice(baseSlug.length + 1));
    if (Number.isInteger(suffix) && suffix > maxSuffix) {
      maxSuffix = suffix;
    }
  });

  return `${baseSlug}-${maxSuffix + 1}`;
}

async function requireAdmin(event: RequestEvent) {
  const session = await event.locals.auth();

  if (!session?.user?.isAdmin) {
    throw error(403, 'Admin required');
  }

  return session;
}

export const load: PageServerLoad = async (event) => {
  await requireAdmin(event);
  const [categories, tags] = await Promise.all([getAllCategories(), getAllTags()]);
  return { categories, tags };
};

export const actions: Actions = {
  create: async (event) => {
    const session = await requireAdmin(event);

    const data = await event.request.formData();
    const rawTitle = data.get('title')?.toString() || '';
    const rawSlug = data.get('slug')?.toString() || '';
    const rawExcerpt = data.get('excerpt')?.toString() || '';
    const rawContent = data.get('contentMarkdown')?.toString() || '';
    const rawStatus = data.get('status')?.toString() || 'draft';
    const rawFeaturedImageUrl = data.get('featuredImageUrl')?.toString() || '';
    const rawScheduledFor = data.get('scheduledFor')?.toString() || '';
    const rawMetaTitle = data.get('metaTitle')?.toString() || '';
    const rawMetaDescription = data.get('metaDescription')?.toString() || '';
    const categories = parseCommaList(data.get('categories'));
    const tags = parseCommaList(data.get('tags'));
    const values = {
      title: rawTitle,
      slug: rawSlug,
      excerpt: rawExcerpt,
      contentMarkdown: rawContent,
      status: rawStatus,
      featuredImageUrl: rawFeaturedImageUrl,
      scheduledFor: rawScheduledFor,
      metaTitle: rawMetaTitle,
      metaDescription: rawMetaDescription,
      categories: categories.join(', '),
      tags: tags.join(', ')
    };

    const parsed = PostSchema.safeParse({
      title: rawTitle,
      slug: rawSlug,
      excerpt: rawExcerpt,
      contentMarkdown: rawContent,
      status: rawStatus,
      featuredImageUrl: rawFeaturedImageUrl,
      scheduledFor: rawScheduledFor,
      metaTitle: rawMetaTitle,
      metaDescription: rawMetaDescription,
      categories,
      tags
    });

    if (!parsed.success) {
      return fail(400, {
        error: parsed.error.errors[0]?.message || 'Invalid form data',
        fieldErrors: parsed.error.flatten().fieldErrors,
        values
      });
    }

    let baseSlug: string;
    try {
      baseSlug = ensureValidSlug(rawSlug || slugify(rawTitle));
    } catch (err) {
      return fail(400, {
        error: err instanceof Error ? err.message : 'Slug is required',
        fieldErrors: { slug: [err instanceof Error ? err.message : 'Slug is required'] },
        values
      });
    }

    const existingSlugs = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(like(blogPosts.slug, `${baseSlug}%`));

    const generatedSlug = resolveUniqueSlug(
      baseSlug,
      existingSlugs.map((row) => row.slug)
    );

    const now = new Date();
    const scheduledForDate = rawScheduledFor ? new Date(rawScheduledFor) : null;
    const hasValidSchedule =
      scheduledForDate instanceof Date && !Number.isNaN(scheduledForDate.getTime());

    if (rawStatus === 'scheduled' && !hasValidSchedule) {
      return fail(400, {
        error: 'Scheduled posts require a publish date',
        fieldErrors: { scheduledFor: ['Scheduled posts require a publish date'] },
        values
      });
    }

    const contentHtml = renderMarkdown(rawContent);
    const readingTimeMinutes = calculateReadingTimeMinutes(rawContent);

    const [post] = await db
      .insert(blogPosts)
      .values({
        authorId: session.user.id,
        slug: generatedSlug,
        title: sanitizeFormInput(rawTitle, 200),
        excerpt: sanitizeFormInput(rawExcerpt, 500),
        contentMarkdown: rawContent,
        contentHtml,
        readingTimeMinutes,
        status: rawStatus,
        featuredImageUrl: rawFeaturedImageUrl || null,
        publishedAt: rawStatus === 'published' ? now : null,
        scheduledFor: rawStatus === 'scheduled' ? scheduledForDate : null,
        metaTitle: sanitizeFormInput(rawMetaTitle, 200),
        metaDescription: sanitizeFormInput(rawMetaDescription, 300),
        createdAt: now,
        updatedAt: now
      })
      .returning();

    const [categoryRecords, tagRecords] = await Promise.all([
      ensureCategories(categories),
      ensureTags(tags)
    ]);

    await Promise.all([
      syncPostCategories(post.id, categoryRecords.map((category) => category.id)),
      syncPostTags(post.id, tagRecords.map((tag) => tag.id))
    ]);

    throw redirect(303, `/admin/blog/${post.id}/edit`);
  },
  savePreview: async (event) => {
    const session = await requireAdmin(event);

    const data = await event.request.formData();
    const rawTitle = data.get('title')?.toString() || '';
    const rawSlug = data.get('slug')?.toString() || '';
    const rawExcerpt = data.get('excerpt')?.toString() || '';
    const rawContent = data.get('contentMarkdown')?.toString() || '';
    const rawFeaturedImageUrl = data.get('featuredImageUrl')?.toString() || '';
    const rawMetaTitle = data.get('metaTitle')?.toString() || '';
    const rawMetaDescription = data.get('metaDescription')?.toString() || '';
    const categories = parseCommaList(data.get('categories'));
    const tags = parseCommaList(data.get('tags'));
    const values = {
      title: rawTitle,
      slug: rawSlug,
      excerpt: rawExcerpt,
      contentMarkdown: rawContent,
      status: 'draft',
      featuredImageUrl: rawFeaturedImageUrl,
      scheduledFor: '',
      metaTitle: rawMetaTitle,
      metaDescription: rawMetaDescription,
      categories: categories.join(', '),
      tags: tags.join(', ')
    };

    const parsed = PostSchema.safeParse({
      title: rawTitle,
      slug: rawSlug,
      excerpt: rawExcerpt,
      contentMarkdown: rawContent,
      status: 'draft',
      featuredImageUrl: rawFeaturedImageUrl,
      scheduledFor: '',
      metaTitle: rawMetaTitle,
      metaDescription: rawMetaDescription,
      categories,
      tags
    });

    if (!parsed.success) {
      return fail(400, {
        error: parsed.error.errors[0]?.message || 'Invalid form data',
        fieldErrors: parsed.error.flatten().fieldErrors,
        values
      });
    }

    let baseSlug: string;
    try {
      baseSlug = ensureValidSlug(rawSlug || slugify(rawTitle));
    } catch (err) {
      return fail(400, {
        error: err instanceof Error ? err.message : 'Slug is required',
        fieldErrors: { slug: [err instanceof Error ? err.message : 'Slug is required'] },
        values
      });
    }

    const existingSlugs = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(like(blogPosts.slug, `${baseSlug}%`));

    const generatedSlug = resolveUniqueSlug(
      baseSlug,
      existingSlugs.map((row) => row.slug)
    );

    const now = new Date();
    const contentHtml = renderMarkdown(rawContent);
    const readingTimeMinutes = calculateReadingTimeMinutes(rawContent);

    const [post] = await db
      .insert(blogPosts)
      .values({
        authorId: session.user.id,
        slug: generatedSlug,
        title: sanitizeFormInput(rawTitle, 200),
        excerpt: sanitizeFormInput(rawExcerpt, 500),
        contentMarkdown: rawContent,
        contentHtml,
        readingTimeMinutes,
        status: 'draft',
        featuredImageUrl: rawFeaturedImageUrl || null,
        publishedAt: null,
        scheduledFor: null,
        metaTitle: sanitizeFormInput(rawMetaTitle, 200),
        metaDescription: sanitizeFormInput(rawMetaDescription, 300),
        createdAt: now,
        updatedAt: now
      })
      .returning();

    const [categoryRecords, tagRecords] = await Promise.all([
      ensureCategories(categories),
      ensureTags(tags)
    ]);

    await Promise.all([
      syncPostCategories(post.id, categoryRecords.map((category) => category.id)),
      syncPostTags(post.id, tagRecords.map((tag) => tag.id))
    ]);

    return {
      previewUrl: `/blog/${post.slug}?preview=1`,
      editUrl: `/admin/blog/${post.id}/edit`
    };
  }
};
