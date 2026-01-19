# AGENTS.md — WeaveAI Design & UI Consistency Contract

This repo already has a cohesive design system (Tailwind CSS v4 + shadcn-svelte/Bits UI).
**All UI changes MUST keep the same brand:** same font, colors, radii, shadows, spacing rhythm, and focus styles.

If you are an AI agent or developer touching UI/UX, treat this as a **hard contract**.

---

## 1) Single source of truth

### Theme tokens (colors, radius, dark mode)
- **Theme variables live in:** `src/app.css`
  - Light theme variables are defined under `:root`.
  - Dark theme overrides are defined under `.dark`.
  - Tailwind semantic tokens are mapped via `@theme inline` (e.g., `--color-background`, `--color-primary`, etc.).
- **Global base styling:** in `src/app.css` → `@layer base`
  - `*` applies `border-border` and `outline-ring/50` globally.
  - `body` applies `bg-background text-foreground`.

### UI components
- **All shared UI components live in:** `src/lib/components/ui/**`
- These components already implement:
  - Correct colors (semantic tokens)
  - Correct radius and shadows
  - Correct focus rings and invalid states
  - Dark-mode compatibility

**Rule:** Prefer existing UI components over custom markup.

## 1.1 shadcn usage rules (required)

This repo already follows the **shadcn-svelte** pattern (built on Bits UI):
- Components live in: `src/lib/components/ui/**`
- Theme tokens live in: `src/app.css`

**Agents must build UI using these existing shadcn components first.** It is **not automatic** — you must import and use them instead of writing raw HTML + Tailwind when a UI primitive exists.

### What to do
- **Buttons:** use `<Button />` from `$lib/components/ui/button`
- **Forms:** use `$lib/components/ui/input`, `textarea`, `select`, `label`, etc.
- **Layout primitives:** use `card`, `tabs`, `dialog`, `dropdown-menu`, `tooltip`, `popover`, etc.
- **Styling:** rely on semantic tokens (`bg-background`, `text-foreground`, `border-border`, etc.) so light/dark mode stays correct.

### Import convention
Prefer importing from the component folder (barrel) when available, e.g.:

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Settings</Card.Title>
    <Card.Description>Update your profile</Card.Description>
  </Card.Header>
  <Card.Content class="space-y-4">
    <Input placeholder="Name" />
    <Button variant="default">Save</Button>
  </Card.Content>
</Card.Root>
```

### What not to do
- Don’t create custom button/input styles with raw Tailwind.
- Don’t hardcode colors/radii/shadows.
- Don’t introduce a second UI library or a separate “design system.”


---

## 2) Typography

### Font
- **Primary font:** Inter
- Loaded in: `src/app.css` (Google Fonts import)
- Applied globally in: `src/app.html` (`<body class="font-inter">`)
- Tailwind theme token: `@theme { --font-inter: "Inter", "sans-serif"; }`

**Rule:** Never introduce a new UI font.

### Common text patterns (use these defaults)
- Page title: `text-3xl font-bold tracking-tight`
- Section title: `text-xl font-semibold` (or `text-lg font-semibold`)
- Standard UI text: `text-sm`
- Supporting/muted text: `text-muted-foreground text-sm` (or `text-xs`)

---

## 3) Colors (brand consistency)

### Always use semantic Tailwind classes
Use these (examples):
- Backgrounds: `bg-background`, `bg-card`, `bg-popover`, `bg-accent`, `bg-secondary`
- Text: `text-foreground`, `text-muted-foreground`, `text-card-foreground`, `text-accent-foreground`
- Borders: `border-border`, Inputs: `border-input`
- Rings: `ring-ring`, `outline-ring/50`

### Do NOT hardcode colors
Avoid:
- Hex values (`#...`)
- Raw grays like `text-zinc-900`, `bg-slate-50`, etc.
- Arbitrary Tailwind colors that bypass the theme tokens

**Allowed exception:** existing special-effect classes in `src/app.css` (e.g., `pricing-gradient-*`) and syntax highlighting imports.

---

## 4) Radius, shadows, and general shape language

### Radius
- Base radius is defined in `src/app.css`: `--radius: 0.625rem`.
- Derived tokens are mapped in `@theme inline`:
  - `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`

**Defaults seen across the UI:**
- Controls (buttons/inputs): `rounded-md`
- Cards: `rounded-xl`

### Shadows
- Controls often use: `shadow-xs`
- Cards often use: `shadow-sm`

**Rule:** Don’t invent new shadow stacks unless you are editing an existing special-effect section.

---

## 5) Buttons (must use the shared component)

**Component:** `src/lib/components/ui/button/button.svelte`

### Import
Prefer:
```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
</script>
```

### Variants (use these exactly)
- `default`: `bg-primary text-primary-foreground shadow-xs hover:bg-primary/90`
- `outline`: `border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground ...`
- `secondary`: `bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80`
- `ghost`: `hover:bg-accent hover:text-accent-foreground ...`
- `link`: `text-primary hover:underline`
- `destructive`: `bg-destructive ... text-white`

### Sizes (use these exactly)
- `default`: `h-9 px-4 py-2`
- `sm`: `h-8 px-3`
- `lg`: `h-10 px-6`
- `icon`, `icon-sm`, `icon-lg`

### Focus/invalid behavior (do not remove)
The button implements:
- `focus-visible:ring-[3px] focus-visible:ring-ring/50`
- `aria-invalid:*` styling

**Rule:** Never recreate button styles manually. Always use `<Button />`.

---

## 6) Inputs & textareas (must use the shared components)

### Input
**Component:** `src/lib/components/ui/input/input.svelte`

Defaults include:
- Height: `h-9`
- Border: `border border-input`
- Radius: `rounded-md`
- Shadow: `shadow-xs`
- Padding: `px-3` with `py-1` (and file input has `pt-1.5`)
- Focus: `focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring`

### Textarea
**Component:** `src/lib/components/ui/textarea/textarea.svelte`

Defaults include:
- Border: `border border-input`
- Radius: `rounded-md`
- Shadow: `shadow-xs`
- Padding: `px-3 py-2`
- Focus ring identical to input

**Rule:** Prefer these components (and other `ui/*` components) instead of raw `<input class="...">`.

---

## 7) Cards (spacing rhythm is part of the brand)

**Components:** `src/lib/components/ui/card/*`

Defaults:
- Card container: `rounded-xl border py-6 shadow-sm` with `gap-6`
- Card header: `px-6` (grid, gap `1.5`)
- Card content: `px-6`
- Card footer: `px-6`

**Rule:** Keep the `px-6` internal rhythm when building new card sections.

---

## 8) Layout & spacing (Admin + User)

### Admin layout
**Source:** `src/routes/admin/+layout.svelte`
- Header height: `h-14`
- Header padding: `px-6`
- Main content wrapper: `container mx-auto px-6 py-8`

Recommended admin page structure:
- Outer wrapper: `space-y-8`
- Title row: `flex items-center justify-between`
- Grids: `gap-4` for compact stats, `gap-8` for section layouts

### User header
**Source:** `src/lib/components/Header.svelte`
- Header: `border-b p-4 flex items-center justify-between`

**Rule:** New screens should start by copying the nearest existing page layout and adjusting content, not redesigning spacing.

---

## 9) Dark mode & accessibility (must remain intact)

- Dark mode is driven by a `.dark` class (via mode-watcher) and theme variables in `src/app.css`.
- Because colors are semantic, **dark mode works automatically** if you don’t hardcode colors.

Accessibility rules:
- Do not remove focus rings or outlines.
- Use existing components to keep `focus-visible:ring-[3px] ring-ring/50` consistent.
- Preserve `aria-invalid:*` styling where provided.

---

## 10) When you need something new

1) **Check if a component already exists** under `src/lib/components/ui/**`.
2) If you must add a new shared component:
   - Put it under `src/lib/components/ui/<component>/`.
   - Follow repo patterns:
     - `data-slot` attributes
     - `cn(...)` utility from `$lib/utils.js`
     - Tailwind-variants (`tv`) where variants/sizes are needed
   - Use semantic colors and existing radii/shadows.

---

## 11) Pre-PR / pre-output checklist (quick)

- [ ] I used semantic tokens (`bg-background`, `text-foreground`, `border-border`, etc.)
- [ ] I did **not** introduce new hex colors / arbitrary palette grays
- [ ] I reused UI components (`Button`, `Input`, `Card`, etc.)
- [ ] Spacing matches existing rhythm (`px-6` card internals, admin `px-6 py-8`, etc.)
- [ ] Focus ring behavior stays intact (`ring-[3px] ring-ring/50`)
- [ ] Dark mode works without special casing
- [ ] Typography remains Inter and uses existing size patterns

---

## 12) Paste this into any agent prompt (short version)

**Do:** use `src/app.css` semantic tokens, reuse `src/lib/components/ui/**` components, keep `rounded-md` for controls and `rounded-xl` for cards, keep `shadow-xs`/`shadow-sm`, keep `px-6` card padding and admin `container mx-auto px-6 py-8`, preserve focus rings (`ring-[3px] ring-ring/50`), keep Inter.

**Don’t:** hardcode hex colors, introduce new fonts, remove focus rings, invent new spacing/radius/shadows.
