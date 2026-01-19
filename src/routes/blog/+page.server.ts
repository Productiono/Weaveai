import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { sanitizeSearchQuery, sanitizeURLParam } from '$lib/utils/sanitization.js';
import {
  getAllCategories,
  getAllTags,
  getCategoryBySlug,
  getTagBySlug,
  getPostCategories,
  getPostTags,
  getPublishedPosts
} from '$lib/server/blog/queries.js';

const PAGE_SIZE = 9;

export const load: PageServerLoad = async ({ url }) => {
  const pageParam = Number(url.searchParams.get('page') || '1');
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const search = sanitizeSearchQuery(url.searchParams.get('search'));
  const categorySlug = sanitizeURLParam(url.searchParams.get('category'));
  const tagSlug = sanitizeURLParam(url.searchParams.get('tag'));

  const [categories, tags] = await Promise.all([getAllCategories(), getAllTags()]);

  const category = categorySlug ? await getCategoryBySlug(categorySlug) : null;
  const tag = tagSlug ? await getTagBySlug(tagSlug) : null;

  if (categorySlug && !category) {
    throw error(404, 'Category not found');
  }

  if (tagSlug && !tag) {
    throw error(404, 'Tag not found');
  }

  const { posts, total } = await getPublishedPosts({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    categoryId: category?.id,
    tagId: tag?.id
  });

  const postIds = posts.map((post) => post.id);
  const [postCategories, postTags] = await Promise.all([
    getPostCategories(postIds),
    getPostTags(postIds)
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return {
    posts: posts.map((post) => ({
      ...post,
      categories: postCategories.get(post.id) || [],
      tags: postTags.get(post.id) || []
    })),
    categories,
    tags,
    filter: {
      search,
      category,
      tag
    },
    pagination: {
      page,
      totalPages,
      total
    }
  };
};
