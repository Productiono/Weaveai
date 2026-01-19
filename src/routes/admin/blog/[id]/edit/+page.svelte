<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import type { PageData } from "./$types";

  let {
    data,
    form
  }: {
    data: PageData;
    form?: { error?: string; values?: Record<string, string> };
  } = $props();

  const statusLabels = {
    draft: "Draft",
    scheduled: "Scheduled",
    published: "Published",
    archived: "Archived"
  } as const;

  let title = $state(form?.values?.title || data.post.title || "");
  let slug = $state(form?.values?.slug || data.post.slug || "");
  let slugEdited = $state(false);
  let excerpt = $state(form?.values?.excerpt || data.post.excerpt || "");
  let contentMarkdown = $state(form?.values?.contentMarkdown || data.post.contentMarkdown || "");
  let status = $state(form?.values?.status || data.post.status || "draft");
  let featuredImageUrl = $state(form?.values?.featuredImageUrl || data.post.featuredImageUrl || "");
  let scheduledFor = $state(form?.values?.scheduledFor || (data.post.scheduledFor ? new Date(data.post.scheduledFor).toISOString().slice(0, 16) : ""));
  let metaTitle = $state(form?.values?.metaTitle || data.post.metaTitle || "");
  let metaDescription = $state(form?.values?.metaDescription || data.post.metaDescription || "");
  let categories = $state(form?.values?.categories || data.postCategories.map((category) => category.name).join(", "));
  let tags = $state(form?.values?.tags || data.postTags.map((tag) => tag.name).join(", "));

  let isUploading = $state(false);
  let uploadError = $state("");
  let uploadedUrl = $state("");
  let editorRef: HTMLTextAreaElement | null = $state(null);

  function generateSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/--+/g, "-");
  }

  $effect(() => {
    if (!slugEdited) {
      slug = generateSlug(title);
    }
  });

  async function uploadImage(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files?.length) return;

    isUploading = true;
    uploadError = "";

    try {
      const formData = new FormData();
      formData.append("file", target.files[0]);

      const response = await fetch("/admin/blog/media", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Upload failed");
      }

      const payload = await response.json();
      uploadedUrl = payload.url;
      featuredImageUrl = payload.url;
    } catch (error) {
      uploadError = error instanceof Error ? error.message : "Upload failed";
    } finally {
      isUploading = false;
      target.value = "";
    }
  }

  async function copyUploadedUrl() {
    if (!uploadedUrl || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(uploadedUrl);
  }

  function insertSnippet(snippet: string) {
    if (!editorRef) {
      contentMarkdown = `${contentMarkdown}${snippet}`;
      return;
    }

    const start = editorRef.selectionStart ?? contentMarkdown.length;
    const end = editorRef.selectionEnd ?? contentMarkdown.length;
    contentMarkdown =
      contentMarkdown.slice(0, start) + snippet + contentMarkdown.slice(end);

    requestAnimationFrame(() => {
      editorRef?.focus();
      const cursor = start + snippet.length;
      editorRef?.setSelectionRange(cursor, cursor);
    });
  }
</script>

<svelte:head>
  <title>Edit Blog Post - Admin</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Edit Blog Post</h1>
      <p class="text-muted-foreground text-sm">
        Update content, preview changes, and publish when ready.
      </p>
    </div>
    <div class="flex items-center gap-2">
      {#if data.post.status === "published"}
        <Button variant="outline" onclick={() => goto(`/blog/${data.post.slug}`)}>
          View Live
        </Button>
      {/if}
      <Button
        variant="outline"
        href={`/blog/${data.post.slug}?preview=1`}
        target="_blank"
        rel="noreferrer"
      >
        Show Preview
      </Button>
      <Button variant="outline" onclick={() => goto("/admin/blog")}>Back</Button>
    </div>
  </div>

  <form
    method="POST"
    action="?/update"
    class="space-y-6"
    use:enhance={() => {
      return async ({ update, result }) => {
        await update();

        if (result.type === "success" && result.data?.previewUrl) {
          window.open(result.data.previewUrl, "_blank", "noreferrer");
        }
      };
    }}
  >
    {#if form?.error}
      <div class="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
        {form.error}
      </div>
    {/if}

    <Card.Root>
      <Card.Header>
        <Card.Title>Post Details</Card.Title>
        <Card.Description>Core content and metadata for the post.</Card.Description>
      </Card.Header>
      <Card.Content class="space-y-6">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="title">Title</Label>
            <Input id="title" name="title" bind:value={title} required />
          </div>
          <div class="space-y-2">
            <Label for="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              bind:value={slug}
              oninput={() => (slugEdited = true)}
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="excerpt">Excerpt</Label>
          <Textarea id="excerpt" name="excerpt" rows={3} bind:value={excerpt} />
        </div>

        <div class="space-y-2">
          <Label for="contentMarkdown">Content (Markdown)</Label>
          <Textarea
            id="contentMarkdown"
            name="contentMarkdown"
            bind:ref={editorRef}
            rows={18}
            bind:value={contentMarkdown}
            class="min-h-[360px] font-mono text-sm leading-relaxed"
            required
          />
          <div class="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onclick={() => insertSnippet("## Heading\\n\\n")}
            >
              H2
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onclick={() => insertSnippet("[Link text](https://example.com)")}
            >
              Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onclick={() => insertSnippet("![Alt text](https://example.com/image.jpg)")}
            >
              Image
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onclick={() => insertSnippet("```\\ncode\\n```\\n")}
            >
              Code
            </Button>
            <span class="text-xs text-muted-foreground">
              Use markdown for headings, lists, and code blocks.
            </span>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Publishing</Card.Title>
        <Card.Description>Set status, schedule, and metadata.</Card.Description>
      </Card.Header>
      <Card.Content class="space-y-6">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="space-y-2">
            <Label>Status</Label>
            <Select.Root bind:value={status}>
              <Select.Trigger>
                <span data-slot="select-value">
                  {statusLabels[status as keyof typeof statusLabels] ?? statusLabels.draft}
                </span>
              </Select.Trigger>
              <Select.Content>
                {#each Object.entries(statusLabels) as [value, label]}
                  <Select.Item value={value}>{label}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            <input type="hidden" name="status" value={status} />
          </div>
          <div class="space-y-2">
            <Label for="scheduledFor">Schedule Date</Label>
            <Input
              id="scheduledFor"
              name="scheduledFor"
              type="datetime-local"
              bind:value={scheduledFor}
              disabled={status !== "scheduled"}
            />
          </div>
          <div class="space-y-2">
            <Label>Featured Image</Label>
            <Input
              name="featuredImageUrl"
              placeholder="Paste image URL"
              bind:value={featuredImageUrl}
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label>Upload Featured or Inline Image</Label>
          <Input type="file" accept="image/*" onchange={uploadImage} disabled={isUploading} />
          {#if isUploading}
            <p class="text-xs text-muted-foreground">Uploading image...</p>
          {/if}
          {#if uploadError}
            <p class="text-xs text-destructive">{uploadError}</p>
          {/if}
          {#if uploadedUrl}
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span class="truncate">Uploaded: {uploadedUrl}</span>
              <Button variant="ghost" size="sm" type="button" onclick={copyUploadedUrl}>
                Copy URL
              </Button>
            </div>
          {/if}
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="categories">Categories (comma separated)</Label>
            <Input
              id="categories"
              name="categories"
              list="category-options"
              bind:value={categories}
            />
            <datalist id="category-options">
              {#each data.categories as category}
                <option value={category.name} />
              {/each}
            </datalist>
          </div>
          <div class="space-y-2">
            <Label for="tags">Tags (comma separated)</Label>
            <Input id="tags" name="tags" list="tag-options" bind:value={tags} />
            <datalist id="tag-options">
              {#each data.tags as tag}
                <option value={tag.name} />
              {/each}
            </datalist>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="metaTitle">Meta Title</Label>
            <Input id="metaTitle" name="metaTitle" bind:value={metaTitle} />
          </div>
          <div class="space-y-2">
            <Label for="metaDescription">Meta Description</Label>
            <Textarea id="metaDescription" name="metaDescription" rows={2} bind:value={metaDescription} />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <div class="flex items-center gap-3">
      <Button type="submit">Save Changes</Button>
      <Button variant="outline" type="submit" formaction="?/savePreview">
        Save Draft & Preview
      </Button>
      <Button variant="outline" type="button" onclick={() => goto("/admin/blog")}>Cancel</Button>
    </div>
  </form>
</div>
