# Theme System

The game engine supports visual themes. A theme controls colors, fonts, borders,
shadows, decorative elements, and the splash screen appearance.

## How it works

Two CSS files are loaded in `index.html`:

```html
<link rel="stylesheet" href="themes/base.css"/>
<link rel="stylesheet" href="themes/digital.css"/>   <!-- swap this line -->
```

- **`base.css`** — shared layout, structural rules, and component styles.
  References CSS custom properties for all visual values.
- **Theme file** (`digital.css`, `fantasy.css`, etc.) — defines all CSS custom
  properties and any visual overrides specific to that theme.

To switch themes, change the second `<link>` to point at a different theme file.

## Available themes

| File | Look |
|------|------|
| `digital.css` | Dark sci-fi — cyan/amber accents, glowing borders, summoning circle, binary rain |
| `fantasy.css` | High fantasy — warm earth tones, gold accents, parchment textures, double borders |

## Creating a new theme

1. Copy `digital.css` as a starting point
2. Modify the `:root` block to set your color palette, fonts, and visual properties
3. Modify the `[data-theme="light"]` block for the light variant
4. Add any component overrides below (border styles, border-radius, etc.)
5. Update the font `<link>` in `index.html` if your theme uses different Google Fonts

### Required CSS variables

Every theme must define these in its `:root` block:

**Colors:**
- `--bg-deep`, `--bg-panel`, `--bg-card`, `--bg-system` — background layers
- `--border-dim`, `--border-glow` — border colors
- `--cyan`, `--cyan-dim`, `--cyan-glow`, `--cyan-glow-md` — primary accent
- `--amber`, `--amber-dim`, `--amber-glow` — secondary accent
- `--green`, `--green-glow` — positive/success
- `--red`, `--red-glow` — negative/danger
- `--rarity-common` through `--rarity-legendary` — item rarity colors
- `--white`, `--blue`, `--purple`, `--gold`, `--silver` — named inline colors
- `--text-primary`, `--text-dim`, `--text-faint` — text hierarchy

**Fonts:**
- `--font-display` — headings, titles (e.g. `'Cinzel', serif`)
- `--font-body` — body text (e.g. `'Crimson Text', serif`)
- `--font-mono` — UI labels, system text (e.g. `'Inconsolata', monospace`)

**Type scale:** `--text-2xs` through `--text-xl`

**Spacing:** `--ls-tight`, `--ls-normal`, `--ls-wide`, `--radius`, `--radius-md`

**Transitions:** `--transition`, `--transition-fast`

### Theme-specific visual variables

These control major visual elements. Set them in `:root` or leave them unset
for sensible defaults from `base.css`:

| Variable | Controls | Default |
|----------|----------|---------|
| `--bg-body-image` | Body background texture/gradient | `none` |
| `--bg-header` | Header background | `var(--bg-panel)` |
| `--bg-header-accent` | Header bottom accent line | gradient with `--cyan-dim` |
| `--bg-chapter-bar` | Chapter bar background | `var(--bg-panel)` |
| `--bg-overlay-backdrop` | Overlay dimming background | `rgba(0,0,0,0.75)` |
| `--overlay-box-glow` | Overlay box gradient glow | gradient with `--cyan-glow` |
| `--chapter-border-color` | Chapter card border | `var(--border-dim)` |
| `--bg-chapter-card` | Chapter card background | `transparent` |
| `--chapter-title-glow` | Chapter title text-shadow | `none` |
| `--choice-indicator` | Character before choice buttons | `'▸'` |
| `--choice-hover-sweep` | Choice button hover background | `var(--cyan-glow)` |
| `--bg-splash-box` | Splash screen background | `var(--bg-panel)` |
| `--splash-accent-top` | Splash top accent line | gradient with `--cyan` |
| `--splash-accent-bottom` | Splash bottom accent line | gradient with `--border-glow` |
| `--bg-splash-vignette` | Splash vignette overlay | dark radial gradient |
| `--splash-sigil-display` | Show/hide the sigil area | `block` |
| `--splash-canvas-display` | Show/hide the canvas background | `block` |
| `--splash-sigil-glow` | Sigil ambient glow | radial gradient |
| `--splash-theme-bg` | Theme-specific splash background layer | `none` |
| `--bg-char-pattern` | Character creation background pattern | `none` |
| `--bg-ending-inline` | Ending block background | `transparent` |
| `--shadow-glow` | Modal/store glow shadow | `none` |

### Splash screen

The splash screen has three visual layers themes can control:

1. **Canvas** (`splash-bg-canvas`) — JS-drawn circuit/binary rain.
   Set `--splash-canvas-display: none` to hide it.
2. **Sigil** (`splash-sigil-wrap`) — the SVG summoning circle.
   Set `--splash-sigil-display: none` to hide it.
3. **Theme background** (`splash-theme-bg`) — a CSS-only layer.
   Set `--splash-theme-bg` to any gradient/texture for your theme.

The JS that draws the sigil and canvas automatically skips initialization when
these elements are hidden via CSS, so there is no performance cost.

### Light/dark toggle

Each theme includes a `[data-theme="light"]` block that overrides the `:root`
variables for light mode. The player can toggle between light and dark using the
sun/moon button in the header. The choice is persisted in `localStorage`.

### Font loading

If your theme uses different fonts, update the Google Fonts `<link>` in
`index.html`. The current default loads Cinzel, Crimson Text, and Inconsolata.
