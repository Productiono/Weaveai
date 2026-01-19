const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'blog',
  'login',
  'register',
  'settings',
  'pricing',
  'terms',
  'privacy',
  'rss.xml',
  'sitemap.xml'
]);

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

export function normalizeSlug(value: string): string {
  return slugify(value || '');
}

export function isReservedSlug(value: string): boolean {
  return RESERVED_SLUGS.has(value);
}

export function ensureValidSlug(value: string): string {
  const slug = normalizeSlug(value);
  if (!slug) {
    throw new Error('Slug is required');
  }
  if (isReservedSlug(slug)) {
    throw new Error(`The slug "${slug}" is reserved`);
  }
  return slug;
}
