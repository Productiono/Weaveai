<script lang="ts">
  import { onMount } from "svelte";
  import { applySyntaxHighlighting } from "$lib/utils/markdown.js";
  import CategoryBadge from "$lib/components/blog/CategoryBadge.svelte";
  import TagPill from "$lib/components/blog/TagPill.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  onMount(() => {
    applySyntaxHighlighting();
  });

  const publishedDate = $derived(
    data.post.publishedAt
      ? new Date(data.post.publishedAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : ""
  );
</script>

<svelte:head>
  <title>{data.post.metaTitle || data.post.title} - {data.settings?.siteName}</title>
  <meta
    name="description"
    content={data.post.metaDescription || data.post.excerpt || data.settings?.siteDescription}
  />
  <meta property="og:title" content={data.post.metaTitle || data.post.title} />
  <meta
    property="og:description"
    content={data.post.metaDescription || data.post.excerpt || data.settings?.siteDescription}
  />
  {#if data.post.featuredImageUrl}
    <meta property="og:image" content={data.post.featuredImageUrl} />
  {/if}
</svelte:head>

<main class="container mx-auto px-6 py-10 space-y-8">
  <article class="space-y-8">
    <header class="space-y-4">
      <div class="flex flex-wrap gap-2">
        {#each data.post.categories as category}
          <CategoryBadge category={category} href={`/blog/category/${category.slug}`} />
        {/each}
      </div>
      <h1 class="text-3xl font-bold tracking-tight">{data.post.title}</h1>
      <div class="flex flex-wrap gap-3 text-sm text-muted-foreground">
        {#if publishedDate}
          <span>{publishedDate}</span>
        {/if}
        {#if data.post.readingTimeMinutes}
          <span>{data.post.readingTimeMinutes} min read</span>
        {/if}
        {#if data.post.authorName}
          <span>By {data.post.authorName}</span>
        {/if}
      </div>
      {#if data.post.featuredImageUrl}
        <img
          src={data.post.featuredImageUrl}
          alt={data.post.title}
          class="w-full rounded-xl border border-border object-cover"
        />
      {/if}
    </header>

    <div class="prose prose-neutral dark:prose-invert max-w-none">
      {@html data.post.contentHtml}
    </div>

    {#if data.post.tags.length}
      <div class="flex flex-wrap gap-2">
        {#each data.post.tags as tag}
          <TagPill tag={tag} href={`/blog/tag/${tag.slug}`} />
        {/each}
      </div>
    {/if}
  </article>
</main>
