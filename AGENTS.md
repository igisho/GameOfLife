# Agent Instructions (AGENTS.md)

This repo is a Vite + React + TypeScript SPA for Conway’s Game of Life (with “noise”). Tailwind is configured via PostCSS, and the UI uses Radix primitives.

## Repo Layout
- `index.html` – Vite entry (mounts `#root`)
- `src/` – React app (game logic + UI components)

## Cursor / Copilot Rules
- No Cursor rules found (`.cursor/rules/` or `.cursorrules` not present).
- No GitHub Copilot instructions found (`.github/copilot-instructions.md` not present).

Treat any future Cursor/Copilot rule files as higher priority than this doc.

---

## Commands

### Install
- `npm install`

### Run (local dev)
- `npm run dev` then open the printed URL (default `http://localhost:5173`)

### Build
- `npm run build`

### Preview
- `npm run preview`

### Lint / Format
- No lint/format tooling is configured.

### Tests
- No automated tests are configured.
- Manual smoke checks:
  - `Play/Pause`, `Step`, `Random`, `Clear`
  - Painting: left add / right erase
  - `Wrap okraje`, grid toggle, theme switch
  - “Šumenie počas hry” noticeably changes evolution

### Running A Single Test (if tests are added)
Pick a runner that supports single-file / single-name execution.
- Node’s built-in test runner (minimal deps):
  - One file: `node --test path/to/test.test.js`
  - By name: `node --test --test-name-pattern "pattern"`
- Vitest (if a `package.json` exists):
  - One file: `npx vitest path/to/test.spec.ts`
  - By name: `npx vitest -t "pattern"`

---

## Code Style Guidelines

### High-level
- Keep changes minimal and focused; avoid refactors that don’t pay rent.
- Preserve Slovak UI text unless the change is explicitly about i18n.

### React / TypeScript
- Prefer function components + hooks.
- Keep simulation state and actions in `src/game/useGameOfLife.ts`.
- Keep canvas drawing imperative inside `src/components/LifeCanvas.tsx` (do not render the grid via React DOM nodes).

### Themes
- Keep theme CSS variables in `src/index.css`.
- Keep theme presets + `applyTheme()` in `src/lib/themes.ts`.
- Canvas fill/stroke colors should always come from CSS vars (`--cell`, `--grid`).

### Events
- Keyboard shortcuts should not trigger while typing in inputs/selects/textarea.
- Prevent default browser actions when overriding (Space, right-click).

---

## Agent Workflow Notes
- If you add tooling/tests, update `## Commands` and include a single-test command.
