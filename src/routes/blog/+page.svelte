<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import * as Pagination from "$lib/components/ui/pagination/index.js";
  import PostCard from "$lib/components/blog/PostCard.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let searchQuery = $state(data.filter.search || "");
  let currentPage = $state(data.pagination.page);
  let categoryValue = $state(data.filter.category?.slug || "all");
  let tagValue = $state(data.filter.tag?.slug || "all");

  $effect(() => {
    searchQuery = data.filter.search || "";
    currentPage = data.pagination.page;
    categoryValue = data.filter.category?.slug || "all";
    tagValue = data.filter.tag?.slug || "all";
  });

  function updateFilters({ pageNumber = 1 }: { pageNumber?: number } = {}) {
    const url = new URL(page.url);
    url.searchParams.set("page", pageNumber.toString());

    if (searchQuery.trim()) {
      url.searchParams.set("search", searchQuery.trim());
    } else {
      url.searchParams.delete("search");
    }

    if (categoryValue !== "all") {
      url.searchParams.set("category", categoryValue);
    } else {
      url.searchParams.delete("category");
    }

    if (tagValue !== "all") {
      url.searchParams.set("tag", tagValue);
    } else {
      url.searchParams.delete("tag");
    }

    goto(url.toString());
  }
</script>

<svelte:head>
  <title>Blog - {data.settings?.siteName}</title>
  <meta name="description" content={data.settings?.siteDescription || "Latest articles"} />
</svelte:head>

<main class="container mx-auto px-6 py-8 space-y-8">
  <header class="space-y-2">
    <h1 class="text-3xl font-bold tracking-tight">Blog</h1>
    <p class="text-muted-foreground text-sm">
      Insights, product updates, and guides from the team.
    </p>
  </header>

  <div class="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_auto] items-end">
    <div class="space-y-2">
      <Label for="blog-search">Search</Label>
      <Input
        id="blog-search"
        placeholder="Search posts"
        bind:value={searchQuery}
        onkeydown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            updateFilters();
          }
        }}
      />
    </div>
    <div class="space-y-2">
      <Label>Category</Label>
      <Select.Root bind:value={categoryValue} onValueChange={() => updateFilters()}>
        <Select.Trigger>
          <Select.Value placeholder="All categories" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="all">All categories</Select.Item>
          {#each data.categories as category}
            <Select.Item value={category.slug}>{category.name}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
    <div class="space-y-2">
      <Label>Tag</Label>
      <Select.Root bind:value={tagValue} onValueChange={() => updateFilters()}>
        <Select.Trigger>
          <Select.Value placeholder="All tags" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="all">All tags</Select.Item>
          {#each data.tags as tag}
            <Select.Item value={tag.slug}>{tag.name}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
    <Button variant="outline" onclick={() => updateFilters()} class="w-full">
      Apply
    </Button>
  </div>

  {#if data.posts.length === 0}
    <div class="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
      No posts match your filters yet.
    </div>
  {:else}
    <div class="grid gap-6 lg:grid-cols-3">
      {#each data.posts as post}
        <PostCard {post} />
      {/each}
    </div>
  {/if}

  {#if data.pagination.totalPages > 1}
    <div class="flex justify-center">
      <Pagination.Root
        count={data.pagination.total}
        perPage={9}
        bind:page={currentPage}
        siblingCount={1}
      >
        {#snippet children({ pages, currentPage: paginationCurrentPage })}
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.PrevButton
                onclick={() => {
                  if (paginationCurrentPage > 1) {
                    updateFilters({ pageNumber: paginationCurrentPage - 1 });
                  }
                }}
              />
            </Pagination.Item>

            {#each pages as pageItem (pageItem.key)}
              {#if pageItem.type === "ellipsis"}
                <Pagination.Item>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              {:else}
                <Pagination.Item>
                  <Pagination.Link
                    {pageItem}
                    isActive={paginationCurrentPage === pageItem.value}
                    onclick={() => updateFilters({ pageNumber: pageItem.value })}
                  >
                    {pageItem.value}
                  </Pagination.Link>
                </Pagination.Item>
              {/if}
            {/each}

            <Pagination.Item>
              <Pagination.NextButton
                onclick={() => {
                  if (paginationCurrentPage < data.pagination.totalPages) {
                    updateFilters({ pageNumber: paginationCurrentPage + 1 });
                  }
                }}
              />
            </Pagination.Item>
          </Pagination.Content>
        {/snippet}
      </Pagination.Root>
    </div>
  {/if}
</main>
