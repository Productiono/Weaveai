<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import CategoryBadge from "$lib/components/blog/CategoryBadge.svelte";
  import TagPill from "$lib/components/blog/TagPill.svelte";

  type Post = {
    slug: string;
    title: string;
    excerpt: string | null;
    featuredImageUrl?: string | null;
    publishedAt: Date | null;
    readingTimeMinutes?: number | null;
    authorName?: string | null;
    categories?: Array<{ name: string; slug: string }>;
    tags?: Array<{ name: string; slug: string }>;
  };

  let { post } = $props<{ post: Post }>();

  const metaParts = $derived([
    post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null,
    post.readingTimeMinutes ? `${post.readingTimeMinutes} min read` : null,
    post.authorName ? `By ${post.authorName}` : null,
  ].filter(Boolean));
</script>

<Card.Root class="overflow-hidden">
  {#if post.featuredImageUrl}
    <img
      src={post.featuredImageUrl}
      alt={post.title}
      class="h-48 w-full object-cover"
      loading="lazy"
    />
  {/if}
  <Card.Header class="space-y-3">
    <div class="flex flex-wrap gap-2">
      {#if post.categories?.length}
        {#each post.categories as category}
          <CategoryBadge category={category} href={`/blog/category/${category.slug}`} />
        {/each}
      {/if}
    </div>
    <Card.Title class="text-xl">
      <a href={`/blog/${post.slug}`} class="hover:underline">
        {post.title}
      </a>
    </Card.Title>
    {#if metaParts.length}
      <Card.Description>
        {metaParts.join(" • ")}
      </Card.Description>
    {/if}
  </Card.Header>
  <Card.Content class="space-y-4">
    {#if post.excerpt}
      <p class="text-sm text-muted-foreground">{post.excerpt}</p>
    {/if}
    {#if post.tags?.length}
      <div class="flex flex-wrap gap-2">
        {#each post.tags as tag}
          <TagPill tag={tag} href={`/blog/tag/${tag.slug}`} />
        {/each}
      </div>
    {/if}
  </Card.Content>
</Card.Root>
