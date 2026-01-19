<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import ServiceSidebar from "$lib/components/ServiceSidebar.svelte";

  import ArrowUpRightIcon from "@lucide/svelte/icons/arrow-up-right";
  import BarChart3Icon from "@lucide/svelte/icons/bar-chart-3";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import CheckCircle2Icon from "@lucide/svelte/icons/check-circle-2";
  import ClipboardListIcon from "@lucide/svelte/icons/clipboard-list";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
</script>

<Sidebar.Provider defaultOpen>
  <ServiceSidebar />
  <Sidebar.Inset>
    <div class="flex h-full flex-col">
      <header class="flex h-16 items-center gap-3 border-b px-6">
        <Sidebar.Trigger class="cursor-pointer" />
        <Separator orientation="vertical" class="h-6" />
        <div class="flex flex-col">
          <span class="text-sm font-medium">Services</span>
          <span class="text-xs text-muted-foreground">
            Sidebar blocks · Collapsible navigation
          </span>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm">Share</Button>
          <Button size="sm">New service</Button>
        </div>
      </header>

      <div class="flex-1 space-y-6 p-6">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight">Sidebar</h1>
          <p class="text-sm text-muted-foreground">
            A composable, themeable, and customizable sidebar component built with
            shadcn/ui.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <Card.Root>
            <Card.Header class="flex flex-row items-center justify-between">
              <Card.Title class="text-sm font-medium">Active services</Card.Title>
              <SparklesIcon class="size-4 text-muted-foreground" />
            </Card.Header>
            <Card.Content>
              <div class="text-2xl font-semibold">18</div>
              <p class="text-xs text-muted-foreground">+3 this week</p>
            </Card.Content>
          </Card.Root>
          <Card.Root>
            <Card.Header class="flex flex-row items-center justify-between">
              <Card.Title class="text-sm font-medium">Usage</Card.Title>
              <BarChart3Icon class="size-4 text-muted-foreground" />
            </Card.Header>
            <Card.Content>
              <div class="text-2xl font-semibold">74%</div>
              <p class="text-xs text-muted-foreground">Peak in the last 30 days</p>
            </Card.Content>
          </Card.Root>
          <Card.Root>
            <Card.Header class="flex flex-row items-center justify-between">
              <Card.Title class="text-sm font-medium">Next review</Card.Title>
              <CalendarIcon class="size-4 text-muted-foreground" />
            </Card.Header>
            <Card.Content>
              <div class="text-2xl font-semibold">Aug 22</div>
              <p class="text-xs text-muted-foreground">In 12 days</p>
            </Card.Content>
          </Card.Root>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <Card.Root>
            <Card.Header>
              <Card.Title class="text-base font-semibold">
                Service performance
              </Card.Title>
              <Card.Description>
                Track the most active routes and deployments.
              </Card.Description>
            </Card.Header>
            <Card.Content class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground"
                  >
                    <ClipboardListIcon class="size-4" />
                  </div>
                  <div>
                    <p class="text-sm font-medium">Ingestion API</p>
                    <p class="text-xs text-muted-foreground">v2.4 deployed</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View
                  <ArrowUpRightIcon class="ml-1 size-4" />
                </Button>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground"
                  >
                    <ClipboardListIcon class="size-4" />
                  </div>
                  <div>
                    <p class="text-sm font-medium">Vector Store</p>
                    <p class="text-xs text-muted-foreground">98.1% uptime</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View
                  <ArrowUpRightIcon class="ml-1 size-4" />
                </Button>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground"
                  >
                    <ClipboardListIcon class="size-4" />
                  </div>
                  <div>
                    <p class="text-sm font-medium">Deployment Pipeline</p>
                    <p class="text-xs text-muted-foreground">6 runs today</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View
                  <ArrowUpRightIcon class="ml-1 size-4" />
                </Button>
              </div>
            </Card.Content>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Card.Title class="text-base font-semibold">
                Upcoming tasks
              </Card.Title>
              <Card.Description>
                Planned updates for the next release cycle.
              </Card.Description>
            </Card.Header>
            <Card.Content class="space-y-4">
              {#each [
                {
                  title: "Finalize routing schema",
                  detail: "Review with API team",
                },
                {
                  title: "Ship the monitoring upgrade",
                  detail: "Enable alerts for latency",
                },
                {
                  title: "Refresh onboarding docs",
                  detail: "Add the sidebar guide",
                },
              ] as item}
                <div class="flex items-start gap-3">
                  <CheckCircle2Icon class="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <p class="text-sm font-medium">{item.title}</p>
                    <p class="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              {/each}
            </Card.Content>
          </Card.Root>
        </div>
      </div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
