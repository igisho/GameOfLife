# Conoway

Conwayova Hra života (Game of Life) s „šumením“ – malé React SPA, ktoré rendruje mriežku do `<canvas>` a ovláda simuláciu cez bočný panel.

## Tech stack

- Vite + React + TypeScript
- TailwindCSS (PostCSS)
- Radix UI primitives (Slider/Select/Checkbox/ScrollArea)

## Požiadavky

- Node.js + npm (odporúčané Node 18+)

## Spustenie (najjednoduchšie)

1. Nainštaluj závislosti:

   ```bash
   npm install
   ```

2. Spusti dev server:

   ```bash
   npm run dev
   ```

3. Otvor URL, ktorú vypíše Vite (typicky `http://localhost:5173`).

## Build

```bash
npm run build
```

## Preview (produkčný build lokálne)

```bash
npm run preview
```

## Ovládanie

- `Play/Pause` – spustí/zastaví simuláciu
- `Step` – spraví jeden krok (funguje len keď je pauznuté)
- `Random` – náhodne vygeneruje bunky podľa hustoty
- `Clear` – vymaže všetko

### Kreslenie do mriežky

- Ľavé tlačidlo myši: pridá bunku
- Pravé tlačidlo myši: zmaže bunku

### Klávesové skratky

- `Space` – Play/Pause
- `Enter` – Step
- `R` – Random
- `C` – Clear

## Poznámky

- Canvas farby sa berú z CSS premenných (`--cell`, `--grid`) a menia sa podľa zvolenej témy.
- Grid je veľký (default 1000×1000). Ak by to bolo na niektorých strojoch pomalé, zníž `Riadky/Stĺpce` alebo zväčši `Veľkosť bunky`.
