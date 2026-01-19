import type { RequestHandler } from './$types';
import { getPublishedPosts } from '$lib/server/blog/queries.js';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: RequestHandler = async ({ url, locals }) => {
  const { posts } = await getPublishedPosts({ page: 1, pageSize: 20 });
  const siteName = locals.settings?.siteName || 'WeaveAI';
  const siteDescription = locals.settings?.siteDescription || 'Latest blog posts';
  const baseUrl = url.origin;

  const items = posts
    .map((post) => {
      const link = `${baseUrl}/blog/${post.slug}`;
      const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date().toUTCString();
      return `\n    <item>\n      <title>${escapeXml(post.title)}</title>\n      <link>${link}</link>\n      <guid>${link}</guid>\n      <description>${escapeXml(post.excerpt || '')}</description>\n      <pubDate>${pubDate}</pubDate>\n    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${escapeXml(siteName)} Blog</title>\n    <link>${baseUrl}/blog</link>\n    <description>${escapeXml(siteDescription)}</description>${items}\n  </channel>\n</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml'
    }
  });
};
