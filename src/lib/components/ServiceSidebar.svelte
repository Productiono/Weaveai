<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

  import BellIcon from "@lucide/svelte/icons/bell";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
  import FolderIcon from "@lucide/svelte/icons/folder";
  import HomeIcon from "@lucide/svelte/icons/home";
  import InboxIcon from "@lucide/svelte/icons/inbox";
  import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
  import MoreHorizontalIcon from "@lucide/svelte/icons/more-horizontal";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import SearchIcon from "@lucide/svelte/icons/search";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import StarIcon from "@lucide/svelte/icons/star";
  import UsersIcon from "@lucide/svelte/icons/users";
</script>

<Sidebar.Root variant="inset" collapsible="icon">
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Sidebar.MenuButton
                {...props}
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div
                  class="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"
                >
                  <SparklesIcon class="size-4" />
                </div>
                <div class="flex flex-col text-left leading-none">
                  <span class="text-sm font-semibold">WeaveAI</span>
                  <span class="text-xs text-sidebar-foreground/70">Enterprise</span>
                </div>
                <ChevronDownIcon class="ml-auto size-4" />
              </Sidebar.MenuButton>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            align="start"
            class="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenu.Item class="cursor-pointer">
              <span>WeaveAI</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item class="cursor-pointer">
              <span>WeaveAI Labs</span>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item class="cursor-pointer">
              <span>Create workspace</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
    <Sidebar.Input placeholder="Search" />
  </Sidebar.Header>
  <Sidebar.Separator />
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton tooltipContent="Dashboard" isActive>
              <LayoutDashboardIcon />
              <span>Dashboard</span>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton tooltipContent="Home">
              <HomeIcon />
              <span>Home</span>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton tooltipContent="Inbox">
              <InboxIcon />
              <span>Inbox</span>
            </Sidebar.MenuButton>
            <Sidebar.MenuBadge>12</Sidebar.MenuBadge>
          </Sidebar.MenuItem>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton tooltipContent="Calendar">
              <CalendarIcon />
              <span>Calendar</span>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton tooltipContent="Notifications">
              <BellIcon />
              <span>Notifications</span>
            </Sidebar.MenuButton>
            <Sidebar.MenuBadge>4</Sidebar.MenuBadge>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton tooltipContent="Members">
              <UsersIcon />
              <span>Members</span>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton tooltipContent="Search">
              <SearchIcon />
              <span>Search</span>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton tooltipContent="Settings">
              <SettingsIcon />
              <span>Settings</span>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Favorites</Sidebar.GroupLabel>
      <Sidebar.GroupAction title="Add Favorite">
        <PlusIcon />
        <span class="sr-only">Add Favorite</span>
      </Sidebar.GroupAction>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton tooltipContent="Design System">
              <StarIcon />
              <span>Design System</span>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton tooltipContent="Brand Assets">
              <StarIcon />
              <span>Brand Assets</span>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Projects</Sidebar.GroupLabel>
      <Sidebar.GroupAction title="Add Project">
        <PlusIcon />
        <span class="sr-only">Add Project</span>
      </Sidebar.GroupAction>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each [
            "Weave Cloud",
            "Nova Launch",
            "Orbit Analytics",
            "Customer Portal",
          ] as project}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton tooltipContent={project}>
                <FolderIcon />
                <span>{project}</span>
              </Sidebar.MenuButton>
              <Sidebar.MenuAction>
                <MoreHorizontalIcon />
                <span class="sr-only">Project actions</span>
              </Sidebar.MenuAction>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
  <Sidebar.Separator />
  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Sidebar.MenuButton {...props} size="lg">
                <div class="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-accent">
                  <SparklesIcon class="size-4" />
                </div>
                <div class="flex flex-col text-left leading-none">
                  <span class="text-sm font-semibold">Alex Morgan</span>
                  <span class="text-xs text-sidebar-foreground/70">alex@weave.ai</span>
                </div>
                <ChevronUpIcon class="ml-auto size-4" />
              </Sidebar.MenuButton>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            align="end"
            side="top"
            class="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenu.Item class="cursor-pointer">
              <span>Account</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item class="cursor-pointer">
              <span>Billing</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item class="cursor-pointer">
              <span>Notifications</span>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item class="cursor-pointer">
              <span>Sign out</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
  <Sidebar.Rail />
</Sidebar.Root>
