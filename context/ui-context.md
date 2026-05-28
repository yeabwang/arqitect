# UI Context

## Theme

Dark only. No light mode. The updated visual language follows the Design System reference: a monochrome README-like technical workspace with pure-black ground, restrained grayscale surfaces, hairline borders, and color used only where it communicates live state, status, or canvas semantics.

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Components must use these tokens — no hardcoded hex values or raw Tailwind color classes like `zinc-*`.

| Role             | CSS Variable           | Hex / Value                |
| ---------------- | ---------------------- | -------------------------- |
| Page background  | `--bg-base`            | `#000000`                  |
| Surface          | `--bg-surface`         | `#0a0a0a`                  |
| Elevated surface | `--bg-elevated`        | `#111111`                  |
| Subtle surface   | `--bg-subtle`          | `#161616`                  |
| Canvas surface   | `--bg-canvas`          | `#050505`                  |
| Default border   | `--border-default`     | `#1f1f1f`                  |
| Subtle border    | `--border-subtle`      | `#2a2a2a`                  |
| Faint border     | `--border-faint`       | `#141414`                  |
| Hover border     | `--border-hover`       | `#3a3a3a`                  |
| Grid line        | `--grid-line`          | `rgba(255,255,255,0.025)` |
| Canvas dot       | `--canvas-dot`         | `rgba(255,255,255,0.06)`  |
| Canvas edge      | `--canvas-edge`        | `#f8fafc`                  |
| Primary text     | `--text-primary`       | `#ffffff`                  |
| Secondary text   | `--text-secondary`     | `#a1a1a1`                  |
| Muted text       | `--text-muted`         | `#6e6e6e`                  |
| Faint text       | `--text-faint`         | `#4a4a4a`                  |
| Live accent      | `--accent-primary`     | `#20d7e8`                  |
| Live accent dim  | `--accent-primary-dim` | `rgba(32, 215, 232, 0.12)` |
| Error            | `--state-error`        | `#e07474`                  |
| Success          | `--state-success`      | `#6fc079`                  |
| Warning          | `--state-warning`      | `#d4a55b`                  |
| Inverse hover    | `--interactive-inverse-hover` | `#e8e8e8`          |

Tailwind utility names map to these variables. Use `bg-bg-base`, `bg-bg-surface`, `text-text-primary`, `text-text-muted`, `border-border-default`, `border-border-faint`, `bg-bg-canvas`, etc.

Shared illustrative SVG, shadow, presence, and node palette values also live in `globals.css` as CSS variables (`--node-*`, `--presence-*`, `--shadow-overlay-*`, `--canvas-*`). Marketing, dashboard, auth, and editor surfaces must reference those variables or their Tailwind mappings instead of embedding literal color values in component files.

## Typography

| Role      | Font           | CSS Variable              |
| --------- | -------------- | ------------------------- |
| UI text   | Inter          | `--font-inter`            |
| Code/mono | JetBrains Mono | `--font-jetbrains-mono`   |

Both fonts are loaded via `next/font/google` and applied as CSS variables on the `<html>` element. The base `body` uses Inter with `antialiased`; mono labels, identifiers, and numbered section prefixes use JetBrains Mono.

## Border Radius

Radius increases with surface depth — smaller for inner elements, larger for outer containers.

| Context           | Class         |
| ----------------- | ------------- |
| Inline / small UI | `rounded-xl`  |
| Cards / panels    | `rounded-2xl` |
| Modal / overlay   | `rounded-3xl` |

## Canvas

### Node Color Palette

8 defined color pairs. Each pair specifies a dark node fill and a vivid contrasting text color tuned for readability on the dark canvas. Defined in `types/canvas.ts` as `NODE_COLORS`.

| Node fill | Text color | Character              |
| --------- | ---------- | ---------------------- |
| `#1F1F1F` | `#EDEDED`  | Neutral dark (default) |
| `#10233D` | `#52A8FF`  | Blue                   |
| `#2E1938` | `#BF7AF0`  | Purple                 |
| `#331B00` | `#FF990A`  | Orange                 |
| `#3C1618` | `#FF6166`  | Red                    |
| `#3A1726` | `#F75F8F`  | Pink                   |
| `#0F2E18` | `#62C073`  | Green                  |
| `#062822` | `#0AC7B4`  | Teal                   |

Default node color: `#1F1F1F` with `#EDEDED` text.

### Edge Style

Smooth-step path with an arrow marker. Default edge color: `#f8fafc`. Stroke width is thin — edges are visually secondary to nodes.

### Node Shapes

6 supported shapes, defined in `types/canvas.ts` as `NODE_SHAPES`. Complex shapes (diamond, hexagon, cylinder) are rendered as inline SVGs rather than CSS borders.

- `rectangle` — default general-purpose node
- `diamond` — decision / gateway
- `circle` — event / endpoint
- `pill` — service / process
- `cylinder` — database / storage
- `hexagon` — external system / boundary

### Connection Handles

Small white circular handles, hidden by default, revealed on node hover. Appear at all four sides of a node.

### Canvas Background

React Flow `<Background>` component. Canvas sits on the base background color.

## Component Library

shadcn/ui on top of Tailwind. No custom design system. Components live in `components/ui/`. Use the `shadcn` CLI to add new components rather than writing them from scratch.

## Layout Patterns

- Editor workspace: full-viewport layout — floating sidebar overlay on the left, center canvas, slide-over AI sidebar on the right.
- Sidebars: floating overlay with dark semi-transparent background and subtle border.
- Modals and dialogs: centered overlay, `rounded-3xl`, dark background with backdrop blur.
- Navbar: top bar with dark background and bottom border.

## Icons

Lucide React. Stroke-based icons only — no filled variants. Icon sizes: `h-4 w-4` for inline, `h-5 w-5` for buttons, `h-8 w-8` for feature icons in empty states.
