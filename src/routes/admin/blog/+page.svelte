<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import * as Pagination from "$lib/components/ui/pagination/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let currentPage = $state(data.pagination.page);
  let searchQuery = $state(data.filters.search || "");
  let statusValue = $state(data.filters.status || "all");

  $effect(() => {
    currentPage = data.pagination.page;
    searchQuery = data.filters.search || "";
    statusValue = data.filters.status || "all";
  });

  function updateFilters({ pageNumber = 1 }: { pageNumber?: number } = {}) {
    const url = new URL(page.url);
    url.searchParams.set("page", pageNumber.toString());

    if (searchQuery.trim()) {
      url.searchParams.set("search", searchQuery.trim());
    } else {
      url.searchParams.delete("search");
    }

    if (statusValue !== "all") {
      url.searchParams.set("status", statusValue);
    } else {
      url.searchParams.delete("status");
    }

    goto(url.toString());
  }

  function formatDate(dateValue?: string | Date | null) {
    if (!dateValue) return "—";
    return new Date(dateValue).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Blog Posts - Admin</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Blog</h1>
      <p class="text-muted-foreground text-sm">
        Create, edit, and publish posts for the public blog.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" onclick={() => goto("/admin/blog/categories")}>
        Categories
      </Button>
      <Button variant="outline" onclick={() => goto("/admin/blog/tags")}>
        Tags
      </Button>
      <Button onclick={() => goto("/admin/blog/new")}>New Post</Button>
    </div>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Posts</Card.Title>
      <Card.Description>Manage all blog posts and publishing status.</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
      {#if data.loadError}
        <div
          class="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive-foreground"
        >
          {data.loadError}
        </div>
      {/if}
      <div class="grid gap-4 md:grid-cols-[2fr_1fr_auto] items-end">
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
          <Label>Status</Label>
          <Select.Root bind:value={statusValue} onValueChange={() => updateFilters()}>
            <Select.Trigger>
              <Select.Value placeholder="All statuses" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All statuses</Select.Item>
              <Select.Item value="draft">Draft</Select.Item>
              <Select.Item value="scheduled">Scheduled</Select.Item>
              <Select.Item value="published">Published</Select.Item>
              <Select.Item value="archived">Archived</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
        <Button variant="outline" onclick={() => updateFilters()} class="w-full">
          Apply
        </Button>
      </div>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Title</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Author</Table.Head>
            <Table.Head>Published</Table.Head>
            <Table.Head>Updated</Table.Head>
            <Table.Head></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#if data.posts.length === 0}
            <Table.Row>
              <Table.Cell colspan={6} class="text-center text-sm text-muted-foreground">
                No posts found.
              </Table.Cell>
            </Table.Row>
          {:else}
            {#each data.posts as post}
              <Table.Row>
                <Table.Cell class="font-medium">{post.title}</Table.Cell>
                <Table.Cell>
                  <Badge variant={post.status === "published" ? "secondary" : "outline"}>
                    {post.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell class="text-sm text-muted-foreground">
                  {post.authorName || "—"}
                </Table.Cell>
                <Table.Cell class="text-sm text-muted-foreground">
                  {formatDate(post.publishedAt || post.scheduledFor)}
                </Table.Cell>
                <Table.Cell class="text-sm text-muted-foreground">
                  {formatDate(post.updatedAt)}
                </Table.Cell>
                <Table.Cell>
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => goto(`/admin/blog/${post.id}/edit`)}
                  >
                    Edit
                  </Button>
                </Table.Cell>
              </Table.Row>
            {/each}
          {/if}
        </Table.Body>
      </Table.Root>

      {#if data.pagination.totalPages > 1}
        <div class="flex justify-center">
          <Pagination.Root
            count={data.pagination.total}
            perPage={10}
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
    </Card.Content>
  </Card.Root>
</div>
