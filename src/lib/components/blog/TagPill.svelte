<script lang="ts">
  import { Badge } from "$lib/components/ui/badge/index.js";

  let { tag, href } = $props<{ tag: { name: string; slug: string }; href?: string }>();
</script>

{#if href}
  <a href={href}>
    <Badge variant="outline" class="text-xs">
      #{tag.name}
    </Badge>
  </a>
{:else}
  <Badge variant="outline" class="text-xs">
    #{tag.name}
  </Badge>
{/if}
