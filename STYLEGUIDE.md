# Neon Sentinel — Design Style Guide

This document describes the complete visual and interaction design of **Neon Sentinel** so designers can understand its design language, create consistent assets, and extend the game’s look and feel.

---

## 1. Design Philosophy

Neon Sentinel is a **retro arcade shooter** set in a collapsing digital megasystem called **The Grid**. The design language is:

- **Retro-futuristic / cyberpunk** — CRT-inspired effects, neon glows, and a “digital void” feel.
- **Brutalist UI** — Sharp corners, thick borders, no rounded corners on primary UI. Functional and bold.
- **Gamish** — Clear hierarchy, readable HUD, and controls that feel like classic arcade or indie game UI.
- **High contrast** — Dark backgrounds with bright neon accents so interface and gameplay read clearly.

The fiction frames the player as an autonomous security program (**Neon Sentinel**) fighting **The Swarm** (corruption). Visuals should feel like a mix of terminal, arcade cabinet, and sci‑fi control panel.

---

## 2. Color Palette

### 2.1 Primary palette (menus, landing, UI)

| Role | Hex / value | Usage |
|------|-------------|--------|
| **Neon primary (green)** | `#00ff00` | Main accent: borders, text, glows, active states. |
| **Neon secondary (cyan)** | `#00ffff` | Equipped/active highlights, badges, secondary accent. |
| **Neon bright** | `#39ff14` | Stronger highlights where needed. |
| **Accent yellow** | `#c8ff00` | Sci‑fi highlight; optional hover/emphasis. |
| **Accent yellow (dim)** | `rgba(200, 255, 0, 0.4)` | Subtle yellow glow. |

### 2.2 Backgrounds and surfaces

| Role | Value | Usage |
|------|--------|--------|
| **Deep black** | `#0a0a0a` | Page/screen base. |
| **Button background** | `#0b140b` | Solid dark green-black for buttons. |
| **Button hover** | `#0d1a0d` | Slightly lighter on hover. |
| **Panel interior** | `#060606` | Hero/character panel fill. |
| **Game canvas** | `#000000` | In-game background. |

### 2.3 Borders (brutalist / gamish)

| Role | Value | Usage |
|------|--------|--------|
| **Border dark** | `#0d3d0d` | Thick panel/card borders (main green). |
| **Border dark strong** | `#0a2f0a` | Stronger edge where needed. |
| **Locked / inactive** | `#004400`, `#0d2d0d` | Locked cards, empty segments. |

### 2.4 Glows (box-shadow / text-shadow)

- **Bright glow:** `0 0 25px rgba(0, 255, 0, 0.45)`, `0 0 50px rgba(0, 220, 0, 0.22)`.
- **Subtle glow:** `0 0 15px rgba(0, 255, 0, 0.35)`.
- **Inner glow (buttons):** `inset 0 0 0 1px rgba(0, 255, 0, 0.25)`.
- **Outer glow (buttons):** `0 0 20px rgba(0, 255, 0, 0.35)`.

Use green glows to reinforce hierarchy and “active” states without overwhelming the screen.

### 2.5 In-game layer colors (The Grid)

Each system layer has a distinct grid/ambient color to show depth and danger:

| Layer | Name | Grid color (hex) | Feel |
|-------|------|------------------|------|
| 1 | Boot Sector | `#00ff00` | Green — safe zone. |
| 2 | Firewall | `#ffff00` | Yellow — warning. |
| 3 | Security Core | `#00aaff` | Blue — mid depth. |
| 4 | Corrupted AI | `#aa00ff` | Purple — corruption. |
| 5 | Kernel Breach | `#ff3333` | Red — high danger. |
| 6 | System Collapse | `#ff0000` | Bright red — maximum danger. |

Use these in HUD, layer indicators, and any in-game UI that references layers.

---

## 3. Typography

### 3.1 Font roles (menus and landing)

| Role | Font | Use for |
|------|------|---------|
| **Logo** | **Orbitron** | Brand, “WEEKLY SECTOR” and other logo-area text. |
| **Headers** | **Oxanium** | Section titles: “SELECT KERNEL”, “SYSTEM DEPTH”, “UNLOCKED SYSTEMS”, “CHAMPIONS”, “HOW TO PLAY”, START GAME main line. |
| **Titles** | **Rajdhani** | Panel/card titles where a geometric title style is needed. |
| **UI / body** | **Inter** | Body copy, labels, secondary text, footer links. |
| **Buttons & cards** | **Play** | All primary buttons (CHANGE SENTINEL, OPEN INVENTORY, EQUIP MINIMES, START GAME, nav labels) and text inside cards (character name, rank, stats, kernel names, status, cost). |

### 3.2 In-game UI (Phaser)

| Role | Font | Use for |
|------|------|---------|
| **Logo** | Bungee | Big game titles, game over, victory. |
| **Menu** | Rajdhani | Pause, dialogs, menu labels. |
| **Score / HUD** | Share Tech Mono | Score, combo, stats, timers. |
| **Body** | JetBrains Mono | Longer blocks of text in-game. |

### 3.3 Style rules

- **Uppercase** for section headers, button labels, and key HUD elements.
- **Letter-spacing** ~0.05em–0.15em on headers and buttons for a technical feel.
- **Weights:** Bold (700) for headers and buttons; Regular (400) for body; avoid light weights in critical UI.

---

## 4. UI Components

### 4.1 Buttons

- **Shape:** Rectangular, **no border-radius** (sharp corners).
- **Border:** 3px solid neon primary (`#00ff00`).
- **Background:** Solid dark (`#0b140b`); hover `#0d1a0d`.
- **Effect:** Flat face with **inner glow** (thin neon line inside border) and **outer glow** (soft green halo). No heavy 3D offset shadow.
- **Text:** Play, uppercase, bold, neon green with subtle text-shadow glow.
- **START GAME:** Can include a horizontal divider and subtitle (“Liberate the Neon Terminal”) inside the same bordered block.

### 4.2 Panels and cards

- **Border:** Thick (4–6px) solid dark green (`#0d3d0d`). No rounded corners.
- **Background:** Transparent or very dark (`#060606`) with optional subtle grid texture.
- **Optional:** Angular corner brackets (L-shaped) at corners for a “frame” look.
- **Shadow:** Soft green glow + optional dark offset shadow for depth (e.g. `6px 6px 0 rgba(0, 35, 0, 0.85)`).
- **Hero/character panel:** Same border rules; interior can have a very subtle grid and noise texture.

### 4.3 Portrait / character frame

- **Border:** 2px solid neon primary.
- **Corner detail:** Small angular brackets (L-shapes) at top-left and top-right of the frame.
- **Inner shadow:** Slight darkening so the character reads clearly.

### 4.4 Stat bars and segments

- **Filled:** Bright neon green with gradient and glow.
- **Empty:** Very dark (`#0d0d0d`) with dark green border (`#0d2d0d`).
- **Segments:** 10 blocks per bar; small gap between blocks. No rounded corners on segments.
- **Health dots:** 5 circles; filled = neon green with glow; empty = dark green/black.

---

## 5. Visual Effects

### 5.1 Scanlines

- **Effect:** Subtle repeating horizontal lines over the whole viewport (e.g. 2px repeat).
- **Color:** Very faint green tint `rgba(0, 255, 0, 0.03)`.
- **Use:** Applied to landing and menu pages via a `.scanlines` class to suggest CRT/terminal.

### 5.2 Background

- **Landing / menus:** Full-bleed image `sentinel-bg.png` (dark grid, neon green, perspective). A **black overlay** (e.g. `rgba(0, 0, 0, 0.5)`) sits on top so content stays readable.
- **Optional:** Soft green radial gradients and subtle animated “star” dots for atmosphere.
- **In-game Layer 1:** Background image `bg-img.png`; other layers use their own scene art.

### 5.3 Grid and texture

- **Hero panel:** Optional 20px grid and very subtle noise (e.g. SVG fractal noise) for a digital feel.
- **In-game:** Perspective grid and particles that match the current layer color.

---

## 6. Imagery and Assets

- **Logo:** Used in header; can have a soft green glow (drop-shadow).
- **Icons:** Nav (Hall, Profile, Settings, Market, Inventory, Login) — simple, readable at small size; neon green or cyan when active. Inventory uses `icon-inventory.svg`; other nav icons follow the same neon style.
- **Character art:** Hero/kernel portraits in frames with thin neon border and corner brackets.
- **Backgrounds:** Dark, green-dominant, with grid or data-field feel. Avoid busy patterns that compete with UI.

---

## 7. Motion and Interaction

- **Buttons:** No strong 3D “lift” on hover; rely on glow and background darken. Active/press can use a slight inset shadow.
- **Panels:** Optional very subtle pulse on glow for hero/character panel.
- **Animations:** Prefer short (0.15–0.3s), functional transitions. Avoid playful or bouncy motion.

---

## 8. Accessibility and Consistency

- **Contrast:** Neon green on dark meets readability when glow is not overdone. Keep body text and labels clear.
- **Focus/hover:** Ensure interactive elements have visible focus and hover states (border + glow).
- **Spacing:** Use consistent padding (e.g. 1rem–1.5rem for panels, 16px gap between buttons) so layout stays predictable across landing, menus, and modals.

---

## 9. Summary Checklist for Designers

- **Colors:** Neon green `#00ff00` and cyan `#00ffff` as primary accents; dark greens and black for surfaces and borders.
- **Type:** Orbitron (logo), Oxanium (headers), Play (buttons and card text), Rajdhani (titles), Inter (body).
- **UI:** Brutalist — sharp corners, thick borders, flat buttons with inner/outer glow, no rounded corners on main components.
- **Atmosphere:** Dark base, green glows, optional scanlines and grid, layer-specific colors in-game.
- **Assets:** Dark, grid-like backgrounds; clear icons; character art in neon-bordered frames.

Use this style guide to keep new screens, components, and marketing materials aligned with Neon Sentinel’s retro-futuristic, brutalist, gamish identity.
