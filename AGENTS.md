# Agent Instructions (AGENTS.md)

This repo is a single, self-contained web app in `index.html` (HTML + CSS + vanilla browser JS for Conway’s Game of Life with “noise”). There is **no package manager, build step, linter, or test runner configured**.

If you introduce tooling (e.g., add `package.json`), update this file with the new commands.

## Repo Layout
- `index.html` – single-file app (styles + scripts inlined)

## Cursor / Copilot Rules
- No Cursor rules found (`.cursor/rules/` or `.cursorrules` not present).
- No GitHub Copilot instructions found (`.github/copilot-instructions.md` not present).

Treat any future Cursor/Copilot rule files as higher priority than this doc.

---

## Commands

### Run (local dev)
Serving over HTTP avoids browser file:// limitations.
- Python: `python3 -m http.server 5173` then open `http://localhost:5173/index.html`
- Node (if available): `npx --yes serve .` then open the printed URL

### Build
- No build step; open/serve `index.html` directly.

### Lint / Format
- No lint/format tooling is configured.
- If you add minimal formatting, prefer Prettier:
  - Check: `npx prettier --check index.html`
  - Fix: `npx prettier --write index.html`

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
- Keep the app **single-file and dependency-free** unless explicitly asked otherwise.
- Make minimal, focused changes; avoid refactors that don’t pay rent.
- Preserve Slovak UI text unless the change is explicitly about i18n.

### Formatting
- Indentation: **2 spaces** (HTML/CSS/JS).
- JavaScript: **semicolons**.
- JS strings: **single quotes** (`'...'`), except template literals.
- Keep section dividers consistent: `// ----------------------------`.

### HTML
- Keep IDs stable; JS wiring relies on them.
- Add new controls in three places:
  - Markup block in the left panel
  - Reference in `const el = { ... }`
  - Event wiring in the “UI wiring” section

### CSS
- Prefer CSS variables in `:root` for themeable values.
- Keep class naming consistent with the file (compact/lowercase, e.g. `.canvasWrap`).
- Don’t introduce a new CSS methodology (BEM/utility) unless asked.

### Themes
- Add new theme variables to `THEMES` and keep variable names consistent (`--bg`, `--text`, ...).
- `applyTheme()` should remain the single place that syncs canvas paint colors with CSS vars.

### JavaScript: Imports / Modules
- Current code uses no `import` statements and no bundler.
- Avoid adding module-only features (ESM imports, import maps) unless the user requests a multi-file setup.

### JavaScript: Structure
- Centralize DOM lookups in `el` (no repeated `getElementById` in hot paths).
- Centralize mutable simulation data in `state`.
- Prefer small helpers (`clamp`, `keyOf`, `rcOf`) and guard clauses.
- Keep render logic in `draw()`; call it intentionally (avoid redundant redraws).

### JavaScript: DOM + Events
- Prefer `addEventListener` (no inline `onclick=` attributes).
- Keyboard shortcuts should not trigger while typing in inputs/selects/textarea.
- Use `e.preventDefault()` when overriding browser defaults (e.g., Space, right-click).
- Keep event handlers small; delegate to named helpers.

### JavaScript: Canvas + Drawing
- Canvas size is derived from grid × `cellSize`; update `canvas.width/height` in `resizeCanvas()`.
- Use `ctx.save()` / `ctx.restore()` around temporary draw state changes (alpha/line width).
- Keep fill/stroke colors sourced from theme CSS vars (see `applyTheme()`).

### Simulation / Rules
- Keep GoL evolution in `stepOnce()`; it should:
  - Apply noise first (if enabled), then evolve one generation.
  - Use `Map` neighbor counts + a fresh `Set` for the next state.
- Keep wrap-edge behavior centralized (avoid re-implementing wrap logic in multiple places).

### JavaScript: Naming
- `camelCase` for variables/functions (`noiseIntensity`, `cellFromEvent`).
- `SCREAMING_SNAKE_CASE` for constants/patterns (`GOSPER_GUN`).
- Prefer explicit units in names (`speedMs`, `cellSize`).

### JavaScript: “Types” / Conversions
- No TypeScript; be careful with runtime conversions.
- Parse numeric inputs with `parseInt(..., 10)` or `Number(...)`.
- Clamp user inputs to safe bounds (see `resizeCanvas()`).

### State / Collections
- Prefer creating a new `Set`/`Map` for “next” state instead of mutating while iterating.

### Error Handling
- Avoid throwing in UI paths.
- Use safe fallbacks (e.g., default theme to `dark`).
- Treat out-of-bounds paint operations as no-ops.
- Timer lifecycle: always clear an existing interval before starting a new one (`setRunning`).

### Performance
- Avoid per-frame DOM queries; use cached `el` refs.
- Avoid allocating in hot paths (favor reusing helpers/structures when reasonable).
- Don’t iterate the full `rows × cols` grid unless necessary; prefer working from `state.live`.
- Avoid calling `draw()` repeatedly inside loops; batch changes then draw once.
- Keep timer changes centralized in `setRunning()` to prevent duplicate intervals.

### Accessibility
- Prefer explicit `<label>` text for inputs and toggles.
- Don’t rely on color alone for state; keep the status pill text updated.

### Browser Target
- Target modern evergreen browsers; don’t add features requiring transpilation.

---

## Agent Workflow Notes
- Before large changes, confirm the requirement to keep everything in `index.html`.
- If you add tooling/tests, update `## Commands` and include a single-test command.
