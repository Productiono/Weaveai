import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db/index.js';
import { blogTags } from '$lib/server/db/schema.js';
import { ensureValidSlug, slugify } from '$lib/server/blog/slug.js';
import { sanitizeFormInput } from '$lib/utils/sanitization.js';
import { requireAdmin } from '$lib/server/blog/requireAdmin.js';
import { eq } from 'drizzle-orm';

const TagSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional()
});

export const load: PageServerLoad = async ({ locals }) => {
  await requireAdmin(locals);
  const tags = await db.select().from(blogTags).orderBy(blogTags.name);
  return { tags };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    await requireAdmin(locals);
    const data = await request.formData();
    const rawName = data.get('name')?.toString() || '';
    const rawSlug = data.get('slug')?.toString() || '';

    const parsed = TagSchema.safeParse({
      name: rawName,
      slug: rawSlug
    });

    if (!parsed.success) {
      return fail(400, {
        error: parsed.error.errors[0]?.message || 'Invalid tag data',
        values: {
          name: rawName,
          slug: rawSlug
        }
      });
    }

    const slug = ensureValidSlug(rawSlug || slugify(rawName));

    const [existing] = await db
      .select({ id: blogTags.id })
      .from(blogTags)
      .where(eq(blogTags.slug, slug));

    if (existing) {
      return fail(400, {
        error: 'Tag slug already exists',
        values: {
          name: rawName,
          slug: rawSlug
        }
      });
    }

    await db.insert(blogTags).values({
      name: sanitizeFormInput(rawName, 100),
      slug,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return { success: true };
  },
  delete: async ({ request, locals }) => {
    await requireAdmin(locals);
    const data = await request.formData();
    const id = data.get('id')?.toString();
    if (!id) {
      return fail(400, { error: 'Tag ID is required' });
    }

    await db.delete(blogTags).where(eq(blogTags.id, id));
    return { success: true };
  }
};
