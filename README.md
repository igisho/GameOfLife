# Spacetime Medium (Conoway)

A Vite + React + TypeScript single‑page app that renders Conway’s Game of Life on a large canvas and (optionally) couples it to a visual “wave medium”: a continuous-ish field with memory, thresholds, and nucleation.

This project is **not a physics simulation**. It is a deliberately controllable toy model meant to make certain ideas intuitive: **emergent objects as stable modes**, **threshold effects**, **memory / non‑Markov dynamics**, and **feedback between “things” and “environment”.**

Repository: https://github.com/igisho/GameOfLife
Live demo: https://conway.altky.sk/

---

## Why this project exists

This app started as a visual sandbox inspired by a companion research/ontology write‑up (maintained separately from this repo). The core motivation is:

- If you take seriously the intuition “the world is one dynamical medium”, then **objects** (particles, excitations, persistent structures) should be describable as **stable or quasi‑stable modes of that medium**, not as externally inserted primitives.
- In such a picture, **local behavior can depend on non‑local state** (because memory and long‑range correlations are part of the medium). “Separability” becomes a useful approximation, not a fundamental axiom.
- Many interesting phenomena become questions about **regimes**: when do fluctuations die out, when do they cross a threshold and stabilize, when does a mode persist, and when does it collapse.

Conway’s Game of Life is a good “minimal metaphor” for this: simple local rules can generate persistent patterns (oscillators, gliders, guns). This project extends that metaphor with an explicit, tunable “environment” layer so you can explore what changes when the environment has **memory** and **threshold‑based formation**.

---

## Conceptual background (from the companion notes, translated)

The theory notes motivating this toy model use a “lake” metaphor:

- The medium is like an infinite lake: it is never perfectly still; it carries residual motion and a history (memory).
- Sometimes “a droplet” appears: a local excitation that looks like an object, yet it is still just the lake behaving in a persistent mode.
- Memory matters: when the environment retains a trace of past events, local objects can behave as if they “read” the medium.

In the broader ontological frame:

- There is one fundamental medium: dynamic, nonlinear, with memory.
- Time/space are treated as emergent descriptions of global state change and relational structure.
- “Particles” are processes/modes (stable excitations), not inserted point objects.
- Separability is an approximation that can fail in regimes with strong memory / correlations.

This app does **not** claim to implement that ontology physically; it only borrows the conceptual vocabulary to label controllable behaviors.

---

## What the app actually simulates

### 1) Conway automaton (grid)
- A large 2D grid (`rows × cols`) updated by the classic rule **B3/S23** (Moore 8‑neighborhood).
- Optional **wrap edges** (torus topology).
- Two cell layers can be enabled:
  - **cells** (matter)
  - **anti‑cells** (antimatter)
- Each layer follows the same Conway rule independently.
- When a cell and an anti‑cell land on the same coordinate after an update, they **annihilate** (both removed).

### 2) Wave medium (field)
- A separate downsampled grid simulates a signed scalar field (rendered as the colored “sea”).
- The medium includes:
  - driving impulses (“hopping”) tied to sources derived from current cells/anti‑cells
  - memory accumulation and feedback
  - nonlinear term and spatial coupling (laplacians)
  - optional ambient noise (random blobs)
- This field is primarily for visualization and controlled feedback experiments.

### 3) Nucleation (medium → grid)
When `Medium mode = Nucleation`, the medium can create new grid structures:
- If the smoothed field crosses `nucleationThreshold`, the app emits a small seed cluster on the Conway grid.
- Positive threshold crossings create cells; negative crossings create anti‑cells (if enabled).

This is the key “toy mechanism” for exploring *threshold → stabilization* ideas.

---

## What this app is NOT

To keep the README honest:

- Not a model of real spacetime, quantum mechanics, cosmology, or particle physics.
- Not energy‑conserving; parameters are not calibrated to any physical units.
- Not evidence for a matter/antimatter explanation of the observable universe.
- The “anti‑cell” layer is a sign/orientation toy (useful for symmetry/bias experiments), not physical antimatter.
- The wave field is a deliberately designed dynamical system for exploration; it should not be interpreted as a validated physical PDE.

---

## Getting started

### Requirements
- Node.js + npm (recommended Node 18+)

### Install
```bash
npm install
```

### Run (dev)
```bash
npm run dev
```
Open the printed URL (usually `http://localhost:5173`).

### Build
```bash
npm run build
```

### Preview (local production build)
```bash
npm run preview
```

---

## Controls

### Buttons
- Play/Pause
- Step (only when paused)
- Random
- Stop / Clear

### Drawing
- Left mouse: add cell
- Right mouse: erase cell

### Shortcuts
- `Space`: Play/Pause
- `Enter`: Step
- `R`: Random
- `C`: Clear

---

## Suggested experiments

A few repeatable ways to probe “what causes what”:

- **Pure GOL baseline**: set `Medium mode = Off` and compare lifetimes/attractors.
- **Environment-driven formation**: enable `Nucleation` and slowly vary `Nucleation threshold`.
- **Memory vs. noise**: compare `Ambient fluctuations` off/on while changing memory parameters.
- **Topology**: compare `Wrap edges` on/off (toroidal recirculation can strongly change long-run dynamics).
- **Symmetry tests**: use the ± quickstarts that seed a paired cell/anti‑cell pattern (O/A/X patterns) and observe whether one sign dominates under your settings.

---

## Tech stack
- Vite + React + TypeScript
- TailwindCSS (via PostCSS)
- Radix UI primitives (Slider/Select/Checkbox/ScrollArea)

---

## Roadmap (experimental)

These are exploratory directions for studying dynamical regimes in this toy model. They are **not** claims about real particle physics.

- **Multi-species excitations:** extend beyond a single matter/anti-matter sign by introducing multiple discrete, *spin-like internal states* (i.e., distinct excitation “types”).
- **Interaction experiments:** explore different cross-coupling / annihilation rules between types, and how memory + thresholds bias long-run composition.
- **Diagnostics:** add observables (counts per type, symmetry/bias metrics, attractor hints) to make comparisons reproducible.

---

## Notes for contributors
- The project intentionally prioritizes **clarity and controllability** over physical realism.
- Please keep UI text consistent (Slovak strings exist; use i18n keys).
- Canvas colors come from CSS vars (`--cell`, `--anti-cell`, `--grid`).
