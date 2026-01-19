CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" text PRIMARY KEY NOT NULL,
  "authorId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "excerpt" text,
  "contentMarkdown" text NOT NULL,
  "contentHtml" text,
  "readingTimeMinutes" integer,
  "status" text NOT NULL DEFAULT 'draft',
  "featuredImageUrl" text,
  "publishedAt" timestamp,
  "scheduledFor" timestamp,
  "metaTitle" text,
  "metaDescription" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "blog_posts_status_published_idx" ON "blog_posts" ("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "blog_posts_author_idx" ON "blog_posts" ("authorId");

CREATE TABLE IF NOT EXISTS "blog_categories" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "description" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "blog_tags" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "blog_post_categories" (
  "postId" text NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
  "categoryId" text NOT NULL REFERENCES "blog_categories"("id") ON DELETE CASCADE,
  PRIMARY KEY ("postId", "categoryId")
);

CREATE INDEX IF NOT EXISTS "blog_post_categories_post_idx" ON "blog_post_categories" ("postId");
CREATE INDEX IF NOT EXISTS "blog_post_categories_category_idx" ON "blog_post_categories" ("categoryId");

CREATE TABLE IF NOT EXISTS "blog_post_tags" (
  "postId" text NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
  "tagId" text NOT NULL REFERENCES "blog_tags"("id") ON DELETE CASCADE,
  PRIMARY KEY ("postId", "tagId")
);

CREATE INDEX IF NOT EXISTS "blog_post_tags_post_idx" ON "blog_post_tags" ("postId");
CREATE INDEX IF NOT EXISTS "blog_post_tags_tag_idx" ON "blog_post_tags" ("tagId");

CREATE TABLE IF NOT EXISTS "blog_media" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "filename" text NOT NULL,
  "originalName" text NOT NULL,
  "mimeType" text NOT NULL,
  "fileSize" integer NOT NULL,
  "storageLocation" text NOT NULL DEFAULT 'local',
  "path" text NOT NULL,
  "url" text,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "blog_media_user_created_idx" ON "blog_media" ("userId", "createdAt");
