import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db/index.js';
import { blogCategories } from '$lib/server/db/schema.js';
import { ensureValidSlug, slugify } from '$lib/server/blog/slug.js';
import { sanitizeFormInput } from '$lib/utils/sanitization.js';
import { requireAdmin } from '$lib/server/blog/requireAdmin.js';
import { eq } from 'drizzle-orm';

const CategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional()
});

export const load: PageServerLoad = async ({ locals }) => {
  await requireAdmin(locals);
  const categories = await db.select().from(blogCategories).orderBy(blogCategories.name);
  return { categories };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    await requireAdmin(locals);
    const data = await request.formData();
    const rawName = data.get('name')?.toString() || '';
    const rawSlug = data.get('slug')?.toString() || '';
    const rawDescription = data.get('description')?.toString() || '';

    const parsed = CategorySchema.safeParse({
      name: rawName,
      slug: rawSlug,
      description: rawDescription
    });

    if (!parsed.success) {
      return fail(400, {
        error: parsed.error.errors[0]?.message || 'Invalid category data',
        values: {
          name: rawName,
          slug: rawSlug,
          description: rawDescription
        }
      });
    }

    const slug = ensureValidSlug(rawSlug || slugify(rawName));

    const [existing] = await db
      .select({ id: blogCategories.id })
      .from(blogCategories)
      .where(eq(blogCategories.slug, slug));

    if (existing) {
      return fail(400, {
        error: 'Category slug already exists',
        values: {
          name: rawName,
          slug: rawSlug,
          description: rawDescription
        }
      });
    }

    await db.insert(blogCategories).values({
      name: sanitizeFormInput(rawName, 100),
      slug,
      description: sanitizeFormInput(rawDescription, 300),
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
      return fail(400, { error: 'Category ID is required' });
    }

    await db.delete(blogCategories).where(eq(blogCategories.id, id));
    return { success: true };
  }
};
