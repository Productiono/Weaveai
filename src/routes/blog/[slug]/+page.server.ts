import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { sanitizeURLParam } from '$lib/utils/sanitization.js';
import { renderMarkdown } from '$lib/server/blog/markdown.js';
import { getPostBySlug, getPostCategories, getPostTags } from '$lib/server/blog/queries.js';
import { db } from '$lib/server/db/index.js';
import { blogPosts, users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const slug = sanitizeURLParam(params.slug);
  const previewRequested = url.searchParams.get('preview') === '1';

  let post = null;

  if (previewRequested) {
    const session = await locals.auth();
    if (!session?.user?.isAdmin) {
      throw error(404, 'Post not found');
    }

    const [previewPost] = await db
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
      .where(eq(blogPosts.slug, slug));

    post = previewPost || null;
  } else {
    post = await getPostBySlug(slug);
  }

  if (!post) {
    throw error(404, 'Post not found');
  }

  const [postCategories, postTags] = await Promise.all([
    getPostCategories([post.id]),
    getPostTags([post.id])
  ]);

  return {
    post: {
      ...post,
      contentHtml: post.contentHtml || renderMarkdown(post.contentMarkdown),
      categories: postCategories.get(post.id) || [],
      tags: postTags.get(post.id) || []
    }
  };
};
