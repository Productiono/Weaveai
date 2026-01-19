<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";

  onMount(() => {
    const timeout = setTimeout(() => {
      goto("/newchat");
    }, 5000);

    return () => clearTimeout(timeout);
  });
</script>

<svelte:head>
  <title>Email Verified</title>
  <meta name="description" content="Your account is verified. You can now access the dashboard." />
</svelte:head>

<div class="min-h-screen bg-background">
  <div class="container flex min-h-screen items-center justify-center px-6 py-8">
    <Card.Root class="w-full max-w-md">
      <Card.Header class="space-y-2 text-center">
        <Card.Title class="text-2xl font-semibold tracking-tight">Account verified</Card.Title>
        <Card.Description class="text-sm text-muted-foreground">
          Your account is verified. You can now access the dashboard.
        </Card.Description>
      </Card.Header>
      <Card.Content class="space-y-4 text-center">
        <p class="text-sm text-muted-foreground">
          We will redirect you in 5 seconds.
        </p>
        <Button href="/newchat" class="w-full">Go to dashboard</Button>
      </Card.Content>
    </Card.Root>
  </div>
</div>
