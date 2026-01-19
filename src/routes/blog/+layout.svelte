<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button/index.js";

  let { children, data } = $props();
</script>

<header class="border-b">
  <div class="container mx-auto px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        onclick={() => goto("/")}
        class="cursor-pointer"
      >
        {data.settings?.siteName || "WeaveAI"}
      </Button>
      <span class="text-sm text-muted-foreground">Blog</span>
    </div>
    <div class="flex items-center gap-2">
      <Button
        variant={page.url.pathname === "/blog" ? "secondary" : "ghost"}
        size="sm"
        onclick={() => goto("/blog")}
        class="cursor-pointer"
      >
        Latest Posts
      </Button>
      {#if data.session?.user?.isAdmin}
        <Button
          variant="outline"
          size="sm"
          onclick={() => goto("/admin/blog")}
          class="cursor-pointer"
        >
          Admin
        </Button>
      {/if}
    </div>
  </div>
</header>

{@render children()}
