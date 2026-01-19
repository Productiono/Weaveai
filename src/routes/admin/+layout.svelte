<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import * as Separator from "$lib/components/ui/separator/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import {
    AnalyticsIcon,
    ArrowLeftIcon,
    CreditCardIcon,
    FileTextIcon,
    GemIcon,
    SettingsIcon,
    SparklesIcon,
    UserIcon,
  } from "$lib/icons/index.js";

  let { children, data } = $props();

  const adminNav = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/admin",
      icon: SparklesIcon,
    },
    {
      id: "analytics",
      label: "Analytics",
      path: "/admin/analytics",
      icon: AnalyticsIcon,
    },
    {
      id: "users",
      label: "Users",
      path: "/admin/users",
      icon: UserIcon,
    },
    {
      id: "payments",
      label: "Payments",
      path: "/admin/payments",
      icon: CreditCardIcon,
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      path: "/admin/subscriptions",
      icon: GemIcon,
    },
    {
      id: "blog",
      label: "Blog",
      path: "/admin/blog",
      icon: FileTextIcon,
    },
    {
      id: "settings",
      label: "Site Settings",
      path: "/admin/settings",
      icon: SettingsIcon,
    },
  ];

  const activeNavItem = $derived(() => {
    const currentPath = page.url.pathname;

    if (currentPath === "/admin") return "dashboard";

    const sortedNav = [...adminNav].sort(
      (a, b) => b.path.length - a.path.length
    );

    const matchedItem = sortedNav.find(
      (item) => item.id !== "dashboard" && currentPath.startsWith(item.path)
    );

    return matchedItem?.id || "dashboard";
  });

  const activeNavLabel = $derived(() => {
    return (
      adminNav.find((item) => item.id === activeNavItem())?.label || "Dashboard"
    );
  });
</script>

<svelte:head>
  <title>Admin Dashboard - {data.settings.siteName}</title>
  <meta name="description" content={data.settings.siteDescription} />
</svelte:head>

<Sidebar.Provider class="min-h-screen bg-background">
  <Sidebar.Root variant="inset" collapsible="icon">
    <Sidebar.Header class="border-b border-sidebar-border/60">
      <div class="flex items-center gap-2 px-2 py-3">
        <div
          class="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"
        >
          <SparklesIcon class="size-4" />
        </div>
        <div class="grid flex-1 text-left text-sm leading-tight">
          <span class="font-semibold">WeaveAI</span>
          <span class="text-xs text-muted-foreground">Admin Console</span>
        </div>
      </div>
    </Sidebar.Header>

    <Sidebar.Content class="px-2 py-4">
      <Sidebar.Group>
        <Sidebar.GroupLabel>Admin</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu class="space-y-1">
            {#each adminNav as navItem}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  isActive={activeNavItem() === navItem.id}
                  tooltipContent={navItem.label}
                  onclick={() => goto(navItem.path)}
                >
                  <svelte:component this={navItem.icon} />
                  <span>{navItem.label}</span>
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>

    <Sidebar.Footer class="border-t border-sidebar-border/60">
      <div class="p-2">
        <Button
          variant="ghost"
          class="w-full justify-start gap-2"
          onclick={() => goto("/newchat")}
        >
          <ArrowLeftIcon class="size-4" />
          <span>Go back to app</span>
        </Button>
      </div>
    </Sidebar.Footer>

    <Sidebar.Rail />
  </Sidebar.Root>

  <Sidebar.Inset>
    <header
      class="flex h-14 items-center gap-3 border-b bg-background/95 px-6"
    >
      <Sidebar.Trigger class="md:hidden" />
      <Separator.Root orientation="vertical" class="h-5" />
      <div class="flex flex-1 items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs text-muted-foreground">Admin Dashboard</p>
          <h1 class="text-base font-semibold text-foreground truncate">
            {activeNavLabel()}
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          class="gap-2"
          onclick={() => goto("/newchat")}
        >
          <ArrowLeftIcon class="size-4" />
          <span class="hidden sm:inline">Go back to app</span>
        </Button>
      </div>
    </header>

    <div class="flex-1 overflow-auto">
      <div class="container mx-auto px-6 py-8">
        {@render children()}
      </div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
