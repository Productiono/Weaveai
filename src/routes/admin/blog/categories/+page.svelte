<script lang="ts">
  import { enhance } from "$app/forms";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import type { PageData } from "./$types";

  let { data, form }: { data: PageData; form?: { error?: string; values?: Record<string, string> } } = $props();

  let name = $state(form?.values?.name || "");
  let slug = $state(form?.values?.slug || "");
  let description = $state(form?.values?.description || "");
</script>

<svelte:head>
  <title>Blog Categories - Admin</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Categories</h1>
    <p class="text-muted-foreground text-sm">
      Organize blog posts by category.
    </p>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Add Category</Card.Title>
      <Card.Description>Create a new category for blog posts.</Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/create"
        class="space-y-4"
        use:enhance={() => {
          return async ({ update }) => {
            await update();
          };
        }}
      >
        {#if form?.error}
          <div class="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
            {form.error}
          </div>
        {/if}
        <div class="grid gap-4 md:grid-cols-3">
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" name="name" bind:value={name} required />
          </div>
          <div class="space-y-2">
            <Label for="slug">Slug</Label>
            <Input id="slug" name="slug" bind:value={slug} />
          </div>
          <div class="space-y-2">
            <Label for="description">Description</Label>
            <Input id="description" name="description" bind:value={description} />
          </div>
        </div>
        <Button type="submit">Add Category</Button>
      </form>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>All Categories</Card.Title>
    </Card.Header>
    <Card.Content>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Slug</Table.Head>
            <Table.Head>Description</Table.Head>
            <Table.Head></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#if data.categories.length === 0}
            <Table.Row>
              <Table.Cell colspan={4} class="text-center text-sm text-muted-foreground">
                No categories yet.
              </Table.Cell>
            </Table.Row>
          {:else}
            {#each data.categories as category}
              <Table.Row>
                <Table.Cell class="font-medium">{category.name}</Table.Cell>
                <Table.Cell class="text-sm text-muted-foreground">{category.slug}</Table.Cell>
                <Table.Cell class="text-sm text-muted-foreground">{category.description || "—"}</Table.Cell>
                <Table.Cell>
                  <form method="POST" action="?/delete">
                    <input type="hidden" name="id" value={category.id} />
                    <Button variant="outline" size="sm" type="submit">Delete</Button>
                  </form>
                </Table.Cell>
              </Table.Row>
            {/each}
          {/if}
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>
</div>
