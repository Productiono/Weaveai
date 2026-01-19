<script lang="ts">
  import { enhance } from "$app/forms";
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import Logo from "$lib/components/Logo.svelte";
  import { authSanitizers } from "$lib/utils/sanitization.js";

  let { data, form } = $props();

  let codeDigits = $state(["", "", "", "", "", ""]);
  let verifying = $state(false);
  let resending = $state(false);
  let inputs: HTMLInputElement[] = [];

  const code = $derived(codeDigits.join(""));

  onMount(() => {
    if (!data.verification.canVerify) {
      return;
    }
    inputs[0]?.focus();
  });

  const handleInput = (index: number, event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    const value = target.value.replace(/\D/g, "");
    codeDigits[index] = value.slice(0, 1);
    if (value && index < inputs.length - 1) {
      inputs[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent) => {
    if (event.key === "Backspace" && !codeDigits[index] && index > 0) {
      inputs[index - 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent) => {
    const text = event.clipboardData?.getData("text") || "";
    const digits = text.replace(/\D/g, "").slice(0, codeDigits.length).split("");
    if (digits.length === 0) {
      return;
    }
    event.preventDefault();
    codeDigits = codeDigits.map((_, idx) => digits[idx] || "");
    const nextIndex = Math.min(digits.length, inputs.length - 1);
    inputs[nextIndex]?.focus();
  };

  $effect(() => {
    if (form?.resendSuccess) {
      codeDigits = ["", "", "", "", "", ""];
      inputs[0]?.focus();
    }
  });
</script>

<svelte:head>
  <title>Verify Email - {data.settings.siteName}</title>
  <meta name="description" content="Verify your email address to unlock your dashboard" />
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
        <p class="text-3xl font-bold tracking-tight">Verify your email</p>
        <p class="text-sm text-muted-foreground">
          Enter the code we sent to your inbox to finish setting up your account.
        </p>
      </div>
    </div>
    <div class="flex w-full items-center justify-center p-6 lg:p-8">
      <div class="w-full max-w-md space-y-6">
        <Card.Root>
          <Card.Header class="space-y-2 text-center">
            <Card.Title class="text-2xl font-semibold tracking-tight">
              Check your email
            </Card.Title>
            <Card.Description class="text-sm text-muted-foreground">
              {#if data.verification.email}
                We sent a 6-digit code to <span class="font-medium text-foreground">{data.verification.email}</span>.
              {:else}
                Enter the 6-digit code from your email to continue.
              {/if}
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-5">
            {#if data.verification.message}
              <div class="rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground">
                {data.verification.message}
              </div>
            {/if}

            {#if form?.error}
              <div class="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {authSanitizers.errorMessage(form.error)}
              </div>
            {/if}

            {#if form?.resendError}
              <div class="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {authSanitizers.errorMessage(form.resendError)}
              </div>
            {/if}

            {#if form?.resendSuccess}
              <div class="rounded-md border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
                {authSanitizers.successMessage(form.resendMessage || "Verification code sent.")}
              </div>
            {/if}

            {#if data.verification.canVerify}
              <form
                method="POST"
                action="?/verify"
                use:enhance={() => {
                  verifying = true;
                  return async ({ update }) => {
                    await update();
                    verifying = false;
                  };
                }}
                class="space-y-5"
              >
                <input type="hidden" name="code" value={code} />

                <div class="space-y-3">
                  <div class="flex items-center justify-center gap-2" onpaste={handlePaste}>
                    {#each codeDigits as digit, index}
                      <Input
                        bind:this={inputs[index]}
                        value={digit}
                        inputmode="numeric"
                        autocomplete="one-time-code"
                        class="h-12 w-12 text-center text-lg font-semibold"
                        maxlength={1}
                        oninput={(event) => handleInput(index, event)}
                        onkeydown={(event) => handleKeyDown(index, event)}
                        disabled={verifying}
                        aria-label={`Digit ${index + 1}`}
                      />
                    {/each}
                  </div>
                  <p class="text-center text-xs text-muted-foreground">
                    This code expires in 5 minutes.
                  </p>
                </div>

                <Button type="submit" class="w-full" disabled={verifying || code.length !== 6}>
                  {verifying ? "Verifying..." : "Verify email"}
                </Button>
              </form>

              <form
                method="POST"
                action="?/resend"
                use:enhance={() => {
                  resending = true;
                  return async ({ update }) => {
                    await update();
                    resending = false;
                  };
                }}
              >
                <Button
                  type="submit"
                  variant="secondary"
                  class="w-full"
                  disabled={resending}
                >
                  {resending ? "Sending new code..." : "Resend code"}
                </Button>
              </form>
            {:else}
              <div class="space-y-3">
                <Button href="/login" class="w-full">Sign in</Button>
                <Button href="/register" variant="outline" class="w-full">
                  Create a new account
                </Button>
              </div>
            {/if}
          </Card.Content>
        </Card.Root>

        <p class="text-center text-xs text-muted-foreground">
          Need help? Contact support or double-check your spam folder.
        </p>
      </div>
    </div>
  </div>
</div>
