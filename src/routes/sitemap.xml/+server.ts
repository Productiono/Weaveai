import type { RequestHandler } from './$types';
import { and, eq, lte } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { blogCategories, blogPosts, blogTags } from '$lib/server/db/schema.js';
import { publishScheduledPosts } from '$lib/server/blog/queries.js';

function formatDate(date?: Date | null): string {
  if (!date) return new Date().toISOString();
  return new Date(date).toISOString();
}

export const GET: RequestHandler = async ({ url }) => {
  const baseUrl = url.origin;
  await publishScheduledPosts();

  const posts = await db
    .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
    .from(blogPosts)
    .where(and(eq(blogPosts.status, 'published'), lte(blogPosts.publishedAt, new Date())));

  const categories = await db
    .select({ slug: blogCategories.slug, updatedAt: blogCategories.updatedAt })
    .from(blogCategories);

  const tags = await db
    .select({ slug: blogTags.slug, updatedAt: blogTags.updatedAt })
    .from(blogTags);

  const urls = [
    { loc: `${baseUrl}/blog`, lastmod: formatDate() },
    ...posts.map((post) => ({
      loc: `${baseUrl}/blog/${post.slug}`,
      lastmod: formatDate(post.updatedAt)
    })),
    ...categories.map((category) => ({
      loc: `${baseUrl}/blog/category/${category.slug}`,
      lastmod: formatDate(category.updatedAt)
    })),
    ...tags.map((tag) => ({
      loc: `${baseUrl}/blog/tag/${tag.slug}`,
      lastmod: formatDate(tag.updatedAt)
    }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .map((entry) => `\n  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n  </url>`)
    .join('')}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
};
