import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { storageService } from '$lib/server/storage.js';
import { db } from '$lib/server/db/index.js';
import { blogMedia } from '$lib/server/db/schema.js';
import { sanitizeFilename } from '$lib/utils/sanitization.js';
import { requireAdmin } from '$lib/server/blog/requireAdmin.js';
import { randomUUID } from 'crypto';

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await requireAdmin(locals);

  const data = await request.formData();
  const file = data.get('file');

  if (!(file instanceof File)) {
    return error(400, 'File is required');
  }

  if (!file.type.startsWith('image/')) {
    return error(400, 'Only image uploads are supported');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const safeName = sanitizeFilename(file.name) || 'blog-asset';
  const extension = safeName.includes('.') ? safeName.split('.').pop() : '';
  const filename = extension ? `${randomUUID()}.${extension}` : randomUUID();

  const result = await storageService.uploadBlogAsset({
    buffer,
    mimeType: file.type,
    filename
  });

  const url = await storageService.getBlogPublicUrl(result.path);

  const [record] = await db
    .insert(blogMedia)
    .values({
      userId: session.user.id,
      filename,
      originalName: safeName,
      mimeType: file.type,
      fileSize: file.size,
      storageLocation: result.storageLocation,
      path: result.path,
      url,
      createdAt: new Date()
    })
    .returning();

  return json({
    id: record.id,
    url,
    path: record.path
  });
};
