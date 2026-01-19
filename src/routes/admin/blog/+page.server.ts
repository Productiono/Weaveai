import type { PageServerLoad } from './$types';
import { sanitizeSearchQuery, sanitizeURLParam } from '$lib/utils/sanitization.js';
import { getAdminPosts } from '$lib/server/blog/queries.js';
import { requireAdmin } from '$lib/server/blog/requireAdmin.js';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ url, locals }) => {
  await requireAdmin(locals);
  const pageParam = Number(url.searchParams.get('page') || '1');
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const statusParam = sanitizeURLParam(url.searchParams.get('status'));
  const status = statusParam && ['draft', 'scheduled', 'published', 'archived'].includes(statusParam)
    ? statusParam
    : null;
  const search = sanitizeSearchQuery(url.searchParams.get('search'));

  try {
    const { posts, total } = await getAdminPosts({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      status
    });

    return {
      posts,
      pagination: {
        page,
        totalPages: Math.ceil(total / PAGE_SIZE) || 1,
        total
      },
      filters: {
        status,
        search
      },
      errorMessage: null
    };
  } catch (error) {
    console.error('Failed to load admin blog posts', error);

    return {
      posts: [],
      pagination: {
        page: 1,
        totalPages: 1,
        total: 0
      },
      filters: {
        status,
        search
      },
      errorMessage: 'Unable to load blog posts right now. Please try again.'
    };
  }
};
