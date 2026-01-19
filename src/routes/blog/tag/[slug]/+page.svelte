<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import * as Pagination from "$lib/components/ui/pagination/index.js";
  import PostCard from "$lib/components/blog/PostCard.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let currentPage = $state(data.pagination.page);

  $effect(() => {
    currentPage = data.pagination.page;
  });

  function handlePageChange(newPage: number) {
    const url = new URL(page.url);
    url.searchParams.set("page", newPage.toString());
    goto(url.toString());
  }
</script>

<svelte:head>
  <title>#{data.tag.name} - Blog</title>
  <meta name="description" content={`Posts tagged ${data.tag.name}`} />
</svelte:head>

<main class="container mx-auto px-6 py-8 space-y-8">
  <header class="space-y-2">
    <p class="text-sm text-muted-foreground">Tag</p>
    <h1 class="text-3xl font-bold tracking-tight">#{data.tag.name}</h1>
  </header>

  {#if data.posts.length === 0}
    <div class="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
      No posts found for this tag yet.
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
                    handlePageChange(paginationCurrentPage - 1);
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
                    onclick={() => handlePageChange(pageItem.value)}
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
                    handlePageChange(paginationCurrentPage + 1);
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
