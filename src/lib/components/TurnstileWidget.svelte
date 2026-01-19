<script lang="ts">
  import { onDestroy } from "svelte";

  export let enabled = false;
  export let siteKey = "";
  export let token = "";
  export let inputName = "cf-turnstile-response";
  export let containerClass = "flex justify-center";
  export let size: "normal" | "compact" | "invisible" = "normal";
  export let theme: "auto" | "light" | "dark" = "auto";
  export let id = "auth";

  const callbackId = id.replace(/[^a-zA-Z0-9_]/g, "_");
  const successCallback = `onTurnstileSuccess_${callbackId}`;
  const errorCallback = `onTurnstileError_${callbackId}`;
  const expiredCallback = `onTurnstileExpired_${callbackId}`;

  let callbacksRegistered = false;

  function registerCallbacks() {
    if (callbacksRegistered || !enabled || typeof window === "undefined") {
      return;
    }

    const globalWindow = window as Window & Record<string, (token?: string) => void>;

    globalWindow[successCallback] = function (receivedToken: string) {
      token = receivedToken;
    };

    globalWindow[errorCallback] = function () {
      token = "";
    };

    globalWindow[expiredCallback] = function () {
      token = "";
    };

    callbacksRegistered = true;
  }

  function unregisterCallbacks() {
    if (!callbacksRegistered || typeof window === "undefined") {
      return;
    }

    const globalWindow = window as Window & Record<string, (token?: string) => void>;

    delete globalWindow[successCallback];
    delete globalWindow[errorCallback];
    delete globalWindow[expiredCallback];
    callbacksRegistered = false;
  }

  $: if (enabled) {
    registerCallbacks();
  }

  onDestroy(() => {
    unregisterCallbacks();
  });
</script>

<svelte:head>
  {#if enabled}
    <script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js"
      async
      defer
    ></script>
  {/if}
</svelte:head>

{#if enabled}
  <input type="hidden" name={inputName} bind:value={token} />

  {#if siteKey}
    <div class={containerClass}>
      <div
        class="cf-turnstile"
        data-sitekey={siteKey}
        data-callback={successCallback}
        data-error-callback={errorCallback}
        data-expired-callback={expiredCallback}
        data-theme={theme}
        data-size={size}
      ></div>
    </div>
  {/if}
{/if}
