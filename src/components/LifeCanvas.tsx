import { type MutableRefObject, type MouseEvent, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ThemeName } from '../lib/themes';
import { readCssVar } from '../lib/themes';
import type { GameSettings, PaintMode } from '../game/types';

type Props = {
  settings: GameSettings;
  liveRef: MutableRefObject<Set<number>>;
  antiLiveRef: MutableRefObject<Set<number>>;
  annihilationRef: MutableRefObject<number[]>;
  annihilationNonce: number;
  generation: number;
  drawNonce: number;
  theme: ThemeName;
  running: boolean;
  onPaintCell: (r: number, c: number, mode: PaintMode) => void;
  onNucleateCells: (cells: Array<[number, number]>) => void;
  onNucleateAntiCells: (cells: Array<[number, number]>) => void;
  onMediumAvgAmplitude: (avg: number) => void;
};

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

function keyToRc(cols: number, key: number) {
  return [Math.floor(key / cols), key % cols] as const;
}

type Rgb = { r: number; g: number; b: number };

function parseCssColor(input: string): Rgb {
  const s = input.trim();
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
  }

  const rgbMatch = s.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const parts = rgbMatch[1]
      .split(',')
      .map((p) => p.trim())
      .map((p) => Number(p));
    const r = clamp(parts[0] ?? 0, 0, 255);
    const g = clamp(parts[1] ?? 0, 0, 255);
    const b = clamp(parts[2] ?? 0, 0, 255);
    return { r, g, b };
  }

  return { r: 255, g: 255, b: 255 };
}

function chooseWaveResolution(rows: number, cols: number) {
  // Downsample grid for performance; keep roughly proportional.
  const w = clamp(Math.floor(cols / 4), 160, 512);
  const h = clamp(Math.floor(rows / 4), 160, 512);
  return { w, h };
}

type WaveState = {
  w: number;
  h: number;
  uPrev: Float32Array;
  uCurr: Float32Array;
  uNext: Float32Array;
  lap1: Float32Array;
  lap2: Float32Array;
  memory: Float32Array;
  source: Float32Array;
  cooldown: Uint16Array;
  visited: Uint8Array;
  imageData: ImageData;
  phase: number;
  lastTs: number;
  scanOffset: number;
  lastMetricTs: number;
};

function idxOf(w: number, x: number, y: number) {
  return y * w + x;
}

function laplacianInto({ w, h, wrap }: { w: number; h: number; wrap: boolean }, src: Float32Array, out: Float32Array) {
  for (let y = 0; y < h; y++) {
    const ym1 = y - 1;
    const yp1 = y + 1;
    const yUp = wrap ? (ym1 + h) % h : Math.max(0, ym1);
    const yDown = wrap ? yp1 % h : Math.min(h - 1, yp1);

    for (let x = 0; x < w; x++) {
      const xm1 = x - 1;
      const xp1 = x + 1;
      const xLeft = wrap ? (xm1 + w) % w : Math.max(0, xm1);
      const xRight = wrap ? xp1 % w : Math.min(w - 1, xp1);

      const i = idxOf(w, x, y);
      const center = src[i];
      const left = src[idxOf(w, xLeft, y)];
      const right = src[idxOf(w, xRight, y)];
      const up = src[idxOf(w, x, yUp)];
      const down = src[idxOf(w, x, yDown)];
      out[i] = left + right + up + down - 4 * center;
    }
  }
}

function injectAmbientNoise(state: WaveState, settings: GameSettings, wrap: boolean) {
  if (!settings.lakeNoiseEnabled) return;

  const intensity = clamp(settings.lakeNoiseIntensity, 0, 1);
  if (intensity <= 0) return;

  const area = state.w * state.h;
  const base = area / 4096;
  const blobs = Math.max(0, Math.floor(intensity * 1.5 * base + (Math.random() < intensity * 0.2 ? 1 : 0)));
  if (blobs <= 0) return;

  const size = clamp(settings.lakeBlobSize, 1, 20);
  // Tuned so low intensities still show up after color/alpha mapping.
  const amplitude = 0.4 * intensity;

  for (let b = 0; b < blobs; b++) {
    const cx = Math.floor(Math.random() * state.w);
    const cy = Math.floor(Math.random() * state.h);
    const sign = Math.random() < 0.5 ? -1 : 1;

    if (settings.lakeBlobShape === 'circle') {
      const radius = size;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > radius * radius) continue;
          const x = wrap ? (cx + dx + state.w) % state.w : clamp(cx + dx, 0, state.w - 1);
          const y = wrap ? (cy + dy + state.h) % state.h : clamp(cy + dy, 0, state.h - 1);
          const i = idxOf(state.w, x, y);
          state.uCurr[i] += sign * amplitude;
        }
      }
    } else {
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          const x = wrap ? (cx + dx) % state.w : clamp(cx + dx, 0, state.w - 1);
          const y = wrap ? (cy + dy) % state.h : clamp(cy + dy, 0, state.h - 1);
          const i = idxOf(state.w, x, y);
          state.uCurr[i] += sign * amplitude;
        }
      }
    }
  }
}

export default function LifeCanvas({
  settings,
  liveRef,
  antiLiveRef,
  annihilationRef,
  annihilationNonce,
  generation,
  drawNonce,
  theme,
  running,
  onPaintCell,
  onNucleateCells,
  onNucleateAntiCells,
  onMediumAvgAmplitude,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const waveStateRef = useRef<WaveState | null>(null);

  const paintingRef = useRef(false);
  const paintModeRef = useRef<PaintMode>('add');

  const latestSettingsRef = useRef(settings);
  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  const runningRef = useRef(running);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const annihilationNonceRef = useRef(annihilationNonce);
  useEffect(() => {
    annihilationNonceRef.current = annihilationNonce;
  }, [annihilationNonce]);

  const lastProcessedAnnihilationNonceRef = useRef(0);

  const onMediumAvgAmplitudeRef = useRef(onMediumAvgAmplitude);
  useEffect(() => {
    onMediumAvgAmplitudeRef.current = onMediumAvgAmplitude;
  }, [onMediumAvgAmplitude]);

  const waveColorsRef = useRef<{ pos: Rgb; neg: Rgb } | null>(null);
  const cellColorsRef = useRef<{ live: string; anti: string } | null>(null);

  const canvasWidth = settings.cols * settings.cellSize;
  const canvasHeight = settings.rows * settings.cellSize;

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  }, [canvasHeight, canvasWidth]);

  const syncCanvasColors = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const live = readCssVar('--cell');
    const anti = readCssVar('--anti-cell');
    const grid = readCssVar('--grid');

    cellColorsRef.current = { live, anti };

    ctx.fillStyle = live;
    ctx.strokeStyle = grid;

    waveColorsRef.current = {
      pos: parseCssColor(readCssVar('--wave-pos')),
      neg: parseCssColor(readCssVar('--wave-neg')),
    };
  }, []);

  const syncWaveCanvasSize = useCallback(() => {
    const canvas = waveCanvasRef.current;
    const ctx = waveCtxRef.current;
    if (!canvas || !ctx) return;

    const { w, h } = chooseWaveResolution(settings.rows, settings.cols);
    if (waveStateRef.current?.w === w && waveStateRef.current?.h === h) return;

    canvas.width = w;
    canvas.height = h;

      waveStateRef.current = {
        w,
        h,
        uPrev: new Float32Array(w * h),
        uCurr: new Float32Array(w * h),
        uNext: new Float32Array(w * h),
        lap1: new Float32Array(w * h),
        lap2: new Float32Array(w * h),
        memory: new Float32Array(w * h),
        source: new Float32Array(w * h),
        cooldown: new Uint16Array(w * h),
        visited: new Uint8Array(w * h),
        imageData: ctx.createImageData(w, h),
        phase: 0,
        lastTs: 0,
        scanOffset: 0,
        lastMetricTs: 0,
      };

  }, [settings.cols, settings.rows]);

  const rebuildSourceMap = useCallback(() => {
    const state = waveStateRef.current;
    if (!state) return;

    const w = state.w;
    const h = state.h;

    state.source.fill(0);

    // Map living cells to downsampled grid.
    for (const k of liveRef.current) {
      const [r, c] = keyToRc(settings.cols, k);
      const x = Math.floor((c / settings.cols) * w);
      const y = Math.floor((r / settings.rows) * h);
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      state.source[idxOf(w, x, y)] += 1;
    }

    if (settings.antiparticlesEnabled) {
      for (const k of antiLiveRef.current) {
        const [r, c] = keyToRc(settings.cols, k);
        const x = Math.floor((c / settings.cols) * w);
        const y = Math.floor((r / settings.rows) * h);
        if (x < 0 || x >= w || y < 0 || y >= h) continue;
        state.source[idxOf(w, x, y)] -= 1;
      }
    }

    // Normalize so amplitude is stable across resolutions.
    const cellAreaPerWavePixel = (settings.cols / w) * (settings.rows / h);
    const inv = cellAreaPerWavePixel > 0 ? 1 / cellAreaPerWavePixel : 1;
    for (let i = 0; i < state.source.length; i++) {
      state.source[i] *= inv;
    }

    // Small blur so larger objects emit broader waves.
    const tmp = state.lap1;
    tmp.set(state.source);
    for (let y = 0; y < h; y++) {
      const ym1 = settings.wrap ? (y - 1 + h) % h : Math.max(0, y - 1);
      const yp1 = settings.wrap ? (y + 1) % h : Math.min(h - 1, y + 1);
      for (let x = 0; x < w; x++) {
        const xm1 = settings.wrap ? (x - 1 + w) % w : Math.max(0, x - 1);
        const xp1 = settings.wrap ? (x + 1) % w : Math.min(w - 1, x + 1);
        const sum =
          tmp[idxOf(w, xm1, ym1)] +
          tmp[idxOf(w, x, ym1)] +
          tmp[idxOf(w, xp1, ym1)] +
          tmp[idxOf(w, xm1, y)] +
          tmp[idxOf(w, x, y)] +
          tmp[idxOf(w, xp1, y)] +
          tmp[idxOf(w, xm1, yp1)] +
          tmp[idxOf(w, x, yp1)] +
          tmp[idxOf(w, xp1, yp1)];
        state.source[idxOf(w, x, y)] = sum / 9;
      }
    }
  }, [antiLiveRef, liveRef, settings.antiparticlesEnabled, settings.cols, settings.rows, settings.wrap]);

  const drawCells = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = cellColorsRef.current;
    if (colors) ctx.fillStyle = colors.live;

    for (const k of liveRef.current) {
      const [r, c] = keyToRc(settings.cols, k);
      const x = c * settings.cellSize;
      const y = r * settings.cellSize;
      ctx.fillRect(x, y, settings.cellSize, settings.cellSize);
    }

    if (settings.antiparticlesEnabled) {
      if (colors) ctx.fillStyle = colors.anti;
      for (const k of antiLiveRef.current) {
        const [r, c] = keyToRc(settings.cols, k);
        const x = c * settings.cellSize;
        const y = r * settings.cellSize;
        ctx.fillRect(x, y, settings.cellSize, settings.cellSize);
      }
      if (colors) ctx.fillStyle = colors.live;
    }

    if (settings.showGrid) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1;

      for (let c = 0; c <= settings.cols; c++) {
        const x = c * settings.cellSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let r = 0; r <= settings.rows; r++) {
        const y = r * settings.cellSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [antiLiveRef, liveRef, settings.antiparticlesEnabled, settings.cellSize, settings.cols, settings.rows, settings.showGrid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const waveCanvas = waveCanvasRef.current;
    if (!canvas || !waveCanvas) return;

    const ctx = canvas.getContext('2d');
    const waveCtx = waveCanvas.getContext('2d');
    if (!ctx || !waveCtx) return;

    ctxRef.current = ctx;
    waveCtxRef.current = waveCtx;

    syncCanvasSize();
    syncCanvasColors();
    syncWaveCanvasSize();

    rebuildSourceMap();
    drawCells();
  }, [drawCells, rebuildSourceMap, syncCanvasColors, syncCanvasSize, syncWaveCanvasSize]);

  useEffect(() => {
    syncCanvasSize();
    syncWaveCanvasSize();
    rebuildSourceMap();
    drawCells();
  }, [settings.rows, settings.cols, settings.cellSize, syncCanvasSize, syncWaveCanvasSize, rebuildSourceMap, drawCells]);

  useEffect(() => {
    void theme;
    syncCanvasColors();
    drawCells();
  }, [theme, syncCanvasColors, drawCells]);

  useEffect(() => {
    void generation;
    void drawNonce;
    rebuildSourceMap();
    drawCells();
  }, [generation, drawNonce, rebuildSourceMap, drawCells]);

  useEffect(() => {
    const handleMouseUp = () => {
      paintingRef.current = false;
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    const ctx = waveCtxRef.current;
    if (!ctx) return;

    let frameId: number | null = null;

    const step = (ts: number) => {
      const state = waveStateRef.current;
      const waveCanvas = waveCanvasRef.current;
      if (!state || !ctx || !waveCanvas) {
        frameId = window.requestAnimationFrame(step);
        return;
      }

      const currentSettings = latestSettingsRef.current;
      if (currentSettings.mediumMode === 'off') {
        ctx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
        if (ts - state.lastMetricTs > 120) {
          state.lastMetricTs = ts;
          onMediumAvgAmplitudeRef.current(0);
        }
        state.lastTs = ts;
        frameId = window.requestAnimationFrame(step);
        return;
      }

      // Annihilation releases energy back into the medium.
      // We model this as a localized displacement + velocity impulse with net-zero offset.
      const currentAnnihilationNonce = annihilationNonceRef.current;
      if (currentAnnihilationNonce !== lastProcessedAnnihilationNonceRef.current) {
        lastProcessedAnnihilationNonceRef.current = currentAnnihilationNonce;

        const events = annihilationRef.current;
        if (events.length > 0) {
          const w = state.w;
          const h = state.h;
          const burst = clamp(currentSettings.annihilationBurst, 0, 1);
          const neighborShare = burst * 0.25;
          const maxEventsPerFrame = 250;

          const applyAt = (x: number, y: number, amount: number) => {
            const xx = currentSettings.wrap ? (x + w) % w : clamp(x, 0, w - 1);
            const yy = currentSettings.wrap ? (y + h) % h : clamp(y, 0, h - 1);
            const i = idxOf(w, xx, yy);

            state.uCurr[i] += amount;
            state.uPrev[i] -= amount;
          };

          for (let e = 0; e < events.length && e < maxEventsPerFrame; e++) {
            const key = events[e]!;
            const [r, c] = keyToRc(currentSettings.cols, key);
            const x = Math.floor((c / currentSettings.cols) * w);
            const y = Math.floor((r / currentSettings.rows) * h);

            applyAt(x, y, burst);
            applyAt(x - 1, y, -neighborShare);
            applyAt(x + 1, y, -neighborShare);
            applyAt(x, y - 1, -neighborShare);
            applyAt(x, y + 1, -neighborShare);
          }

          events.length = 0;
        }
      }

      // Medium is governed by Play/Pause.
      if (!runningRef.current) {
        // Keep reporting metrics while paused (flat line).
        if (ts - state.lastMetricTs > 120) {
          state.lastMetricTs = ts;
          let sum = 0;
          let count = 0;
          for (let i = 0; i < state.uCurr.length; i += 8) {
            sum += state.uCurr[i] ?? 0;
            count++;
          }
          onMediumAvgAmplitudeRef.current(count > 0 ? sum / count : 0);
        }

        state.lastTs = ts;
        frameId = window.requestAnimationFrame(step);
        return;
      }

      const wrap = currentSettings.wrap;

      // Keep stable dt (explicit scheme); substep if needed.
      const targetDt = 1 / 60;
      const prevTs = state.lastTs || ts;
      let dt = (ts - prevTs) / 1000;
      dt = clamp(dt, 0, 0.05);
      state.lastTs = ts;

      const steps = Math.max(1, Math.min(4, Math.ceil(dt / targetDt)));
      const hStep = dt / steps;

      // Physical-ish defaults.
      const c2 = 36; // wave speed^2 (in grid units)
      const gamma = 2.2; // damping
      const kappa = 2.0; // dispersion strength

      // Experimental: add a simple local memory + nonlinearity.
      const memoryRate = clamp(currentSettings.mediumMemoryRate, 0, 0.3);
      const memoryCoupling = clamp(currentSettings.mediumMemoryCoupling, 0, 60);
      const nonlinearity = clamp(currentSettings.mediumNonlinearity, 0, 60);

      const hopHz = clamp(currentSettings.hopHz, 0, 20);
      const hopStrength = clamp(currentSettings.hopStrength, 0, 3);
      const hopAmplitude = 0.08 * hopStrength;

      for (let sub = 0; sub < steps; sub++) {
        // Update phase for periodic forcing.
        if (hopHz > 0) {
          state.phase += 2 * Math.PI * hopHz * hStep;
          if (state.phase > Math.PI * 8) state.phase = state.phase % (Math.PI * 2);
        }

        // Ambient background disturbances.
        injectAmbientNoise(state, currentSettings, wrap);

        // Memory update: m(t+dt) = (1-r)m + r*u
        if (memoryRate > 0) {
          const r = clamp(memoryRate, 0, 1);
          const inv = 1 - r;
          for (let i = 0; i < state.uCurr.length; i++) {
            const u = state.uCurr[i];
            const uSafe = Number.isFinite(u) ? clamp(u, -2, 2) : 0;
            const mNext = inv * state.memory[i] + r * uSafe;
            state.memory[i] = Number.isFinite(mNext) ? mNext : 0;
          }
        }

        laplacianInto({ w: state.w, h: state.h, wrap }, state.uCurr, state.lap1);
        laplacianInto({ w: state.w, h: state.h, wrap }, state.lap1, state.lap2);

        const dt2 = hStep * hStep;
        const g = gamma;
        const gFactor = g * hStep * 0.5;
        const denom = 1 + gFactor;
        const sinPhase = hopHz > 0 ? Math.sin(state.phase) : 0;
        const forcingGain = 40;

        for (let i = 0; i < state.uCurr.length; i++) {
          const forcing = forcingGain * hopAmplitude * state.source[i] * sinPhase;

          const u = state.uCurr[i];
          const uSafe = Number.isFinite(u) ? clamp(u, -2, 2) : 0;

          const nonlinearTerm = -nonlinearity * uSafe * uSafe * uSafe;
          const memoryTerm = memoryCoupling * state.memory[i];

          const rhs = c2 * state.lap1[i] - kappa * state.lap2[i] + forcing + nonlinearTerm + memoryTerm;
          const next = (2 * uSafe - (Number.isFinite(state.uPrev[i]) ? state.uPrev[i] : 0) * (1 - gFactor) + dt2 * rhs) / denom;
          state.uNext[i] = Number.isFinite(next) ? next : 0;
        }

        // Rotate buffers.
        const prev = state.uPrev;
        state.uPrev = state.uCurr;
        state.uCurr = state.uNext;
        state.uNext = prev;

        // Nucleation from medium (mode B): one nucleus per connected threshold-break region.
        // We run it once per animation frame (on the last substep), otherwise it over-fires.
        if (currentSettings.mediumMode === 'nucleation' && sub === steps - 1) {
          const threshold = clamp(currentSettings.nucleationThreshold, 0.01, 2);
          const cooldownFrames = Math.max(1, Math.round(0.6 * 60)); // ~600ms at 60fps

          const maxNucleiPerFrame = 4;
          const maxRadiusCells = 8;

          state.visited.fill(0);

          let nucleusCount = 0;
          const nucleiPos: Array<[number, number]> = [];
          const nucleiNeg: Array<[number, number]> = [];

          const component: number[] = [];
          const stack: number[] = [];

          const w = state.w;
          const h = state.h;

          // Signed, smoothed drive: blur u itself (not |u|), so negative crests spawn antiparticles.
          // The blur also turns ring-shaped crests into central bumps.
          const driveA = state.lap1;
          const driveB = state.lap2;

          for (let i = 0; i < state.uCurr.length; i++) {
            driveA[i] = state.uCurr[i];
          }

          const blur3x3 = (src: Float32Array, dst: Float32Array) => {
            for (let y = 0; y < h; y++) {
              const ym1 = wrap ? (y - 1 + h) % h : Math.max(0, y - 1);
              const yp1 = wrap ? (y + 1) % h : Math.min(h - 1, y + 1);
              for (let x = 0; x < w; x++) {
                const xm1 = wrap ? (x - 1 + w) % w : Math.max(0, x - 1);
                const xp1 = wrap ? (x + 1) % w : Math.min(w - 1, x + 1);

                const sum =
                  src[idxOf(w, xm1, ym1)] +
                  src[idxOf(w, x, ym1)] +
                  src[idxOf(w, xp1, ym1)] +
                  src[idxOf(w, xm1, y)] +
                  src[idxOf(w, x, y)] +
                  src[idxOf(w, xp1, y)] +
                  src[idxOf(w, xm1, yp1)] +
                  src[idxOf(w, x, yp1)] +
                  src[idxOf(w, xp1, yp1)];

                dst[idxOf(w, x, y)] = sum / 9;
              }
            }
          };

          blur3x3(driveA, driveB);
          blur3x3(driveB, driveA);

          const pushNeighbor = (x: number, y: number) => {
            const xx = wrap ? (x + w) % w : clamp(x, 0, w - 1);
            const yy = wrap ? (y + h) % h : clamp(y, 0, h - 1);
            stack.push(idxOf(w, xx, yy));
          };

          const len = state.uCurr.length;
          const start = ((state.scanOffset % len) + len) % len;
          state.scanOffset = (start + 9973) % len;

          for (let n = 0; n < len; n++) {
            if (nucleusCount >= maxNucleiPerFrame) break;
            const i = (start + n) % len;
            if (state.visited[i]) continue;
            if (state.cooldown[i] > 0) continue;

            const v0 = driveA[i];
            let sign: 1 | -1 | 0 = 0;
            if (v0 > threshold) sign = 1;
            else if (v0 < -threshold) sign = -1;
            else continue;

            if (sign === -1 && !currentSettings.antiparticlesEnabled) continue;

            // BFS/DFS collect one sign-consistent component.
            component.length = 0;
            stack.length = 0;
            stack.push(i);

            let peakIdx = i;
            let peakValue = v0;

            while (stack.length > 0) {
              const j = stack.pop()!;
              if (state.visited[j]) continue;
              state.visited[j] = 1;

              if (state.cooldown[j] > 0) continue;
              const v = driveA[j];

              if (sign === 1) {
                if (v < threshold) continue;
              } else {
                if (v > -threshold) continue;
              }

              component.push(j);
              if (sign === 1) {
                if (v > peakValue) {
                  peakValue = v;
                  peakIdx = j;
                }
              } else {
                if (v < peakValue) {
                  peakValue = v;
                  peakIdx = j;
                }
              }

              const y = Math.floor(j / w);
              const x = j % w;

              pushNeighbor(x - 1, y);
              pushNeighbor(x + 1, y);
              pushNeighbor(x, y - 1);
              pushNeighbor(x, y + 1);
            }

            if (component.length === 0) continue;

            // Mark cooldown for the whole region so it doesn't spawn many times.
            for (const j of component) state.cooldown[j] = cooldownFrames;

            // Nucleate at the peak of the smoothed drive.
            const peakY = Math.floor(peakIdx / w);
            const peakX = peakIdx % w;

            const centerR = Math.floor(((peakY + 0.5) / h) * currentSettings.rows);
            const centerC = Math.floor(((peakX + 0.5) / w) * currentSettings.cols);

            // Blob radius grows with how strongly we exceeded the threshold.
            const peakMag = Math.abs(peakValue);
            const over = Math.max(0, peakMag - threshold);
            const rel = over / Math.max(1e-6, threshold);
            const radiusCells = clamp(Math.round(Math.sqrt(rel) * 4), 0, maxRadiusCells);

            nucleusCount++;

            const out = sign === 1 ? nucleiPos : nucleiNeg;

            // Small nuclei should be a stable "dot" in Conway: 2×2 block.
            // Use only positive offsets so wrap doesn't visually split it across edges.
            if (radiusCells <= 1) {
              const top = centerR;
              const left = centerC;
              out.push([top, left], [top, left + 1], [top + 1, left], [top + 1, left + 1]);
              continue;
            }

            // Larger nuclei: filled disk (may still evolve under Conway dynamics).
            for (let dr = -radiusCells; dr <= radiusCells; dr++) {
              for (let dc = -radiusCells; dc <= radiusCells; dc++) {
                if (dr * dr + dc * dc > radiusCells * radiusCells) continue;
                out.push([centerR + dr, centerC + dc]);
              }
            }
          }

          if (nucleiPos.length > 0) onNucleateCells(nucleiPos);
          if (currentSettings.antiparticlesEnabled && nucleiNeg.length > 0) onNucleateAntiCells(nucleiNeg);
        }
      }

      // Cooldowns tick down once per frame.
      for (let i = 0; i < state.cooldown.length; i++) {
        if (state.cooldown[i] > 0) state.cooldown[i]--;
      }

      // Report medium metric (avg amplitude) at ~8 Hz.
      if (ts - state.lastMetricTs > 120) {
        state.lastMetricTs = ts;
        let sum = 0;
        let count = 0;
        for (let i = 0; i < state.uCurr.length; i += 8) {
          sum += state.uCurr[i] ?? 0;
          count++;
        }
        onMediumAvgAmplitudeRef.current(count > 0 ? sum / count : 0);
      }

      // Render (subtle color scale) into low-res wave canvas.
      const colors = waveColorsRef.current;
      if (colors) {
        const { data } = state.imageData;
        const alphaScale = 90; // max alpha (0..255)
        const valueScale = 1.2;

        for (let i = 0; i < state.uCurr.length; i++) {
          const u = state.uCurr[i];
          const uSafe = Number.isFinite(u) ? u : 0;

          const v = clamp(uSafe * valueScale, -1, 1);
          // Gamma boosts visibility of subtle waves.
          const a = Math.pow(Math.min(1, Math.abs(v)), 0.65);
          const alpha = Math.max(0, Math.round(alphaScale * a));

          const rgb = v >= 0 ? colors.pos : colors.neg;
          const p = i * 4;
          data[p + 0] = rgb.r;
          data[p + 1] = rgb.g;
          data[p + 2] = rgb.b;
          data[p + 3] = alpha;
        }

        ctx.putImageData(state.imageData, 0, 0);
      }

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);
    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [onNucleateAntiCells, onNucleateCells]);

  const cellFromEvent = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return [0, 0] as const;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const c = Math.floor(x / settings.cellSize);
      const r = Math.floor(y / settings.cellSize);
      return [r, c] as const;
    },
    [settings.cellSize]
  );

  const onMouseDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      paintingRef.current = true;
      paintModeRef.current = e.button === 2 ? 'erase' : 'add';
      const [r, c] = cellFromEvent(e);
      onPaintCell(r, c, paintModeRef.current);
    },
    [cellFromEvent, onPaintCell]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (!paintingRef.current) return;
      const [r, c] = cellFromEvent(e);
      onPaintCell(r, c, paintModeRef.current);
    },
    [cellFromEvent, onPaintCell]
  );

  const wrapperStyle = useMemo(() => ({ width: canvasWidth, height: canvasHeight }), [canvasHeight, canvasWidth]);

  return (
    <div className="relative" style={wrapperStyle}>
      <canvas
        ref={waveCanvasRef}
        className="absolute left-0 top-0 block pointer-events-none"
        style={{ width: canvasWidth, height: canvasHeight, imageRendering: 'auto' }}
      />
      <canvas
        ref={canvasRef}
        className="relative z-10 block"
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
      />
    </div>
  );
}
