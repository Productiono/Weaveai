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
</script>

<svelte:head>
  <title>Blog Tags - Admin</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Tags</h1>
    <p class="text-muted-foreground text-sm">
      Maintain tags for organizing blog posts.
    </p>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Add Tag</Card.Title>
      <Card.Description>Create a new tag for blog posts.</Card.Description>
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
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" name="name" bind:value={name} required />
          </div>
          <div class="space-y-2">
            <Label for="slug">Slug</Label>
            <Input id="slug" name="slug" bind:value={slug} />
          </div>
        </div>
        <Button type="submit">Add Tag</Button>
      </form>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>All Tags</Card.Title>
    </Card.Header>
    <Card.Content>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Slug</Table.Head>
            <Table.Head></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#if data.tags.length === 0}
            <Table.Row>
              <Table.Cell colspan={3} class="text-center text-sm text-muted-foreground">
                No tags yet.
              </Table.Cell>
            </Table.Row>
          {:else}
            {#each data.tags as tag}
              <Table.Row>
                <Table.Cell class="font-medium">{tag.name}</Table.Cell>
                <Table.Cell class="text-sm text-muted-foreground">{tag.slug}</Table.Cell>
                <Table.Cell>
                  <form method="POST" action="?/delete">
                    <input type="hidden" name="id" value={tag.id} />
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
