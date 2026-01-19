<script lang="ts">
  import { Badge } from "$lib/components/ui/badge/index.js";

  let { category, href } = $props<{
    category: { name: string; slug: string };
    href?: string;
  }>();
</script>

{#if href}
  <a href={href}>
    <Badge variant="secondary" class="text-xs">
      {category.name}
    </Badge>
  </a>
{:else}
  <Badge variant="secondary" class="text-xs">
    {category.name}
  </Badge>
{/if}
