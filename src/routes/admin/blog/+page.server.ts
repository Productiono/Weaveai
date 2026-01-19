import type { PageServerLoad } from './$types';
import { sanitizeSearchQuery, sanitizeURLParam } from '$lib/utils/sanitization.js';
import { getAdminPosts } from '$lib/server/blog/queries.js';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ url }) => {
  const pageParam = Number(url.searchParams.get('page') || '1');
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const statusParam = sanitizeURLParam(url.searchParams.get('status'));
  const status = statusParam && ['draft', 'scheduled', 'published', 'archived'].includes(statusParam)
    ? statusParam
    : null;
  const search = sanitizeSearchQuery(url.searchParams.get('search'));

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
    }
  };
};
