import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { sanitizeURLParam } from '$lib/utils/sanitization.js';
import { renderMarkdown } from '$lib/server/blog/markdown.js';
import { getPostBySlug, getPostCategories, getPostTags } from '$lib/server/blog/queries.js';

export const load: PageServerLoad = async ({ params }) => {
  const slug = sanitizeURLParam(params.slug);
  const post = await getPostBySlug(slug);

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
