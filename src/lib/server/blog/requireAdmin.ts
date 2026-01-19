import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function requireAdmin(locals: RequestEvent['locals']) {
  const session = await locals.auth();

  if (!session?.user?.isAdmin) {
    throw error(403, 'Admin required');
  }

  return session;
}
