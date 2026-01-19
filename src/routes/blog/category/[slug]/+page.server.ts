import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { sanitizeURLParam } from '$lib/utils/sanitization.js';
import {
  getAllCategories,
  getAllTags,
  getCategoryBySlug,
  getPostCategories,
  getPostTags,
  getPublishedPosts
} from '$lib/server/blog/queries.js';

const PAGE_SIZE = 9;

export const load: PageServerLoad = async ({ params, url }) => {
  const slug = sanitizeURLParam(params.slug);
  const category = await getCategoryBySlug(slug);

  if (!category) {
    throw error(404, 'Category not found');
  }

  const pageParam = Number(url.searchParams.get('page') || '1');
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const [{ posts, total }, categories, tags] = await Promise.all([
    getPublishedPosts({
      page,
      pageSize: PAGE_SIZE,
      categoryId: category.id
    }),
    getAllCategories(),
    getAllTags()
  ]);

  const postIds = posts.map((post) => post.id);
  const [postCategories, postTags] = await Promise.all([
    getPostCategories(postIds),
    getPostTags(postIds)
  ]);

  return {
    category,
    categories,
    tags,
    posts: posts.map((post) => ({
      ...post,
      categories: postCategories.get(post.id) || [],
      tags: postTags.get(post.id) || []
    })),
    pagination: {
      page,
      totalPages: Math.ceil(total / PAGE_SIZE) || 1,
      total
    }
  };
};
