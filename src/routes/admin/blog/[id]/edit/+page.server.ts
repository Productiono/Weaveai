import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { blogPosts } from '$lib/server/db/schema.js';
import { sanitizeFormInput } from '$lib/utils/sanitization.js';
import { renderMarkdown } from '$lib/server/blog/markdown.js';
import { calculateReadingTimeMinutes } from '$lib/server/blog/reading-time.js';
import { ensureValidSlug, slugify } from '$lib/server/blog/slug.js';
import { ensureCategories, ensureTags, parseCommaList, syncPostCategories, syncPostTags } from '$lib/server/blog/admin.js';
import { getAllCategories, getAllTags, getPostById, getPostCategories, getPostTags } from '$lib/server/blog/queries.js';
import { requireAdmin } from '$lib/server/blog/requireAdmin.js';

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

export const load: PageServerLoad = async ({ params, locals }) => {
  await requireAdmin(locals);
  const post = await getPostById(params.id);

  if (!post) {
    throw redirect(302, '/admin/blog');
  }

  const [categories, tags, postCategories, postTags] = await Promise.all([
    getAllCategories(),
    getAllTags(),
    getPostCategories([post.id]),
    getPostTags([post.id])
  ]);

  return {
    post,
    categories,
    tags,
    postCategories: postCategories.get(post.id) || [],
    postTags: postTags.get(post.id) || []
  };
};

export const actions: Actions = {
  update: async ({ request, params, locals }) => {
    await requireAdmin(locals);

    const postId = params.id;
    const existing = await getPostById(postId);
    if (!existing) {
      return fail(404, { error: 'Post not found' });
    }

    const data = await request.formData();
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
        values: {
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
        }
      });
    }

    const generatedSlug = ensureValidSlug(rawSlug || slugify(rawTitle));

    const [slugExists] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, generatedSlug), ne(blogPosts.id, postId)));

    if (slugExists) {
      return fail(400, {
        error: 'Slug is already in use',
        values: {
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
        }
      });
    }

    const now = new Date();
    const scheduledForDate = rawScheduledFor ? new Date(rawScheduledFor) : null;
    const hasValidSchedule =
      scheduledForDate instanceof Date && !Number.isNaN(scheduledForDate.getTime());

    if (rawStatus === 'scheduled' && !hasValidSchedule) {
      return fail(400, {
        error: 'Scheduled posts require a publish date',
        values: {
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
        }
      });
    }

    const contentHtml = renderMarkdown(rawContent);
    const readingTimeMinutes = calculateReadingTimeMinutes(rawContent);

    await db
      .update(blogPosts)
      .set({
        slug: generatedSlug,
        title: sanitizeFormInput(rawTitle, 200),
        excerpt: sanitizeFormInput(rawExcerpt, 500),
        contentMarkdown: rawContent,
        contentHtml,
        readingTimeMinutes,
        status: rawStatus,
        featuredImageUrl: rawFeaturedImageUrl || null,
        publishedAt: rawStatus === 'published' ? existing.publishedAt || now : null,
        scheduledFor: rawStatus === 'scheduled' ? scheduledForDate : null,
        metaTitle: sanitizeFormInput(rawMetaTitle, 200),
        metaDescription: sanitizeFormInput(rawMetaDescription, 300),
        updatedAt: now
      })
      .where(eq(blogPosts.id, postId));

    const [categoryRecords, tagRecords] = await Promise.all([
      ensureCategories(categories),
      ensureTags(tags)
    ]);

    await Promise.all([
      syncPostCategories(postId, categoryRecords.map((category) => category.id)),
      syncPostTags(postId, tagRecords.map((tag) => tag.id))
    ]);

    throw redirect(303, `/admin/blog/${postId}/edit`);
  },
  savePreview: async ({ request, params, locals }) => {
    await requireAdmin(locals);

    const postId = params.id;
    const existing = await getPostById(postId);
    if (!existing) {
      return fail(404, { error: 'Post not found' });
    }

    const data = await request.formData();
    const rawTitle = data.get('title')?.toString() || '';
    const rawSlug = data.get('slug')?.toString() || '';
    const rawExcerpt = data.get('excerpt')?.toString() || '';
    const rawContent = data.get('contentMarkdown')?.toString() || '';
    const rawFeaturedImageUrl = data.get('featuredImageUrl')?.toString() || '';
    const rawMetaTitle = data.get('metaTitle')?.toString() || '';
    const rawMetaDescription = data.get('metaDescription')?.toString() || '';
    const categories = parseCommaList(data.get('categories'));
    const tags = parseCommaList(data.get('tags'));

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
        values: {
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
        }
      });
    }

    const generatedSlug = ensureValidSlug(rawSlug || slugify(rawTitle));

    const [slugExists] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, generatedSlug), ne(blogPosts.id, postId)));

    if (slugExists) {
      return fail(400, {
        error: 'Slug is already in use',
        values: {
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
        }
      });
    }

    const now = new Date();
    const contentHtml = renderMarkdown(rawContent);
    const readingTimeMinutes = calculateReadingTimeMinutes(rawContent);

    await db
      .update(blogPosts)
      .set({
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
        updatedAt: now
      })
      .where(eq(blogPosts.id, postId));

    const [categoryRecords, tagRecords] = await Promise.all([
      ensureCategories(categories),
      ensureTags(tags)
    ]);

    await Promise.all([
      syncPostCategories(postId, categoryRecords.map((category) => category.id)),
      syncPostTags(postId, tagRecords.map((tag) => tag.id))
    ]);

    return {
      previewUrl: `/blog/${generatedSlug}?preview=1`
    };
  }
};
