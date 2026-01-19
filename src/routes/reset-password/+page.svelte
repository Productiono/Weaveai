<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import Logo from "$lib/components/Logo.svelte";
  import { authSanitizers } from "$lib/utils/sanitization.js";

  import { page } from "$app/state";

  let { data, form } = $props();

  let email = $state("");
  let loading = $state(false);

  // Check for error message from URL params (from expired/invalid tokens)
  const errorParam = page.url.searchParams.get("error");
  const errorMessage = errorParam
    ? authSanitizers.errorMessage(errorParam)
    : null;

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !loading) {
      event.preventDefault();
      const target = event.target as HTMLElement;
      const form = target?.closest("form") as HTMLFormElement;
      form?.requestSubmit();
    }
  }
</script>

<svelte:head>
  <title>Reset Password - {data.settings.siteName}</title>
  <meta
    name="description"
    content="Reset your password for {data.settings.siteName}"
  />
</svelte:head>

<div class="min-h-screen bg-background">
  <div
    class="container relative grid min-h-screen items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0"
  >
    <div class="relative hidden h-full flex-col bg-muted p-10 lg:flex">
      <div class="absolute inset-0 bg-muted" aria-hidden="true"></div>
      <div class="relative z-20 flex items-center text-lg font-medium">
        <Logo class="h-8 w-auto" />
      </div>
      <div class="relative z-20 mt-auto space-y-3">
        <p class="text-3xl font-bold tracking-tight">Reset your password</p>
        <p class="text-sm text-muted-foreground">
          We'll email you a secure link to create a new password.
        </p>
      </div>
    </div>
    <div class="flex w-full items-center justify-center p-6 lg:p-8">
      <div class="w-full max-w-md space-y-6">
        <Card.Root>
          <Card.Header class="space-y-2 text-center">
            <Card.Title class="text-2xl font-semibold tracking-tight">
              Reset your password
            </Card.Title>
            <Card.Description class="text-sm text-muted-foreground">
              Enter your email address and we'll send you a reset link.
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-5">
            {#if errorMessage}
              <div
                class="rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground"
              >
                <div class="font-medium">Token Issue</div>
                <div class="text-muted-foreground">{errorMessage}</div>
              </div>
            {/if}

            {#if form?.success}
              <div
                class="rounded-md border border-primary/20 bg-primary/10 p-3 text-sm text-primary"
              >
                <div class="font-medium">Email Sent!</div>
                <div class="text-primary/80">
                  {authSanitizers.successMessage(form.message)}
                </div>
              </div>
              <div class="text-center">
                <a href="/login" class="text-sm text-primary hover:underline">
                  Back to Login
                </a>
              </div>
            {:else}
              <form
                method="POST"
                use:enhance={() => {
                  loading = true;
                  return async ({ update }) => {
                    await update();
                    loading = false;
                  };
                }}
                class="space-y-4"
              >
                <div class="space-y-2">
                  <Label for="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    bind:value={email}
                    onkeydown={handleKeyDown}
                    disabled={loading}
                    required
                  />
                </div>

                {#if form?.error}
                  <div
                    class="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive"
                  >
                    {authSanitizers.errorMessage(form.error)}
                  </div>
                {/if}

                <Button type="submit" disabled={loading || !email} class="w-full">
                  {loading ? "Sending Reset Link..." : "Send Reset Link"}
                </Button>
              </form>

              <div class="text-center">
                <p class="text-sm text-muted-foreground">
                  Remember your password?
                  <a href="/login" class="text-primary hover:underline">
                    Go back to Login
                  </a>
                </p>
              </div>
            {/if}
          </Card.Content>
          <Card.Footer class="justify-center">
            <p class="text-xs text-muted-foreground text-center">
              Reset links expire after 24 hours for your security.
            </p>
          </Card.Footer>
        </Card.Root>
      </div>
    </div>
  </div>
</div>
