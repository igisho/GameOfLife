import { type MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameSettings, PaintMode } from './types';

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

function keyOf(cols: number, r: number, c: number) {
  return r * cols + c;
}

function rcOf(cols: number, key: number) {
  const r = Math.floor(key / cols);
  const c = key % cols;
  return [r, c] as const;
}

export type UseGameOfLifeResult = {
  settings: GameSettings;
  running: boolean;
  generation: number;
  liveCount: number;
  drawNonce: number;
  liveRef: MutableRefObject<Set<number>>;

  setRunning: (on: boolean) => void;
  toggleRunning: () => void;
  stepOnce: () => void;

  clearAll: () => void;
  randomize: () => void;

  centerPlace: (pattern: string[]) => void;
  paintCell: (r: number, c: number, mode: PaintMode) => void;

  setRows: (rows: number) => void;
  setCols: (cols: number) => void;
  setCellSize: (cellSize: number) => void;

  setWrap: (wrap: boolean) => void;
  setShowGrid: (showGrid: boolean) => void;

  setSpeedMs: (speedMs: number) => void;
  setDensityPercent: (densityPercent: number) => void;

  setNoiseEnabled: (enabled: boolean) => void;
  setNoiseIntensityPercent: (noisePercent: number) => void;
  setBlobSize: (blobSize: number) => void;
  setBlobShape: (shape: GameSettings['blobShape']) => void;
};

export function useGameOfLife(): UseGameOfLifeResult {
  const [settings, setSettingsState] = useState<GameSettings>({
    rows: 1000,
    cols: 1000,
    cellSize: 4,
    wrap: true,
    showGrid: true,
    speedMs: 80,
    density: 0.02,
    noiseEnabled: true,
    noiseIntensity: 0.1,
    blobSize: 4,
    blobShape: 'square',
  });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const liveRef = useRef<Set<number>>(new Set());
  const [liveCount, setLiveCount] = useState(0);
  const [generation, setGeneration] = useState(0);
  const [running, setRunningState] = useState(false);
  const [drawNonce, setDrawNonce] = useState(0);

  const timerRef = useRef<number | null>(null);

  const bumpDraw = useCallback(() => {
    setDrawNonce((x) => x + 1);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setRunning = useCallback(
    (on: boolean) => {
      setRunningState(on);
    },
    []
  );

  const stepOnceInternal = useCallback(() => {
    const s = settingsRef.current;

    const addLive = (r: number, c: number) => {
      let rr = r;
      let cc = c;
      if (s.wrap) {
        rr = (rr + s.rows) % s.rows;
        cc = (cc + s.cols) % s.cols;
      } else {
        if (rr < 0 || rr >= s.rows || cc < 0 || cc >= s.cols) return;
      }
      liveRef.current.add(keyOf(s.cols, rr, cc));
    };

    const applyNoise = () => {
      if (!s.noiseEnabled) return;
      const p = clamp(s.noiseIntensity, 0, 1);
      if (p <= 0) return;

      const area = s.rows * s.cols;
      const base = area / 8000;
      const blobs = Math.max(0, Math.floor(p * 4 * base + (Math.random() < p * 0.5 ? 1 : 0)));
      const speckles = Math.floor(p * 10 * base);

      for (let i = 0; i < speckles; i++) {
        const r = Math.floor(Math.random() * s.rows);
        const c = Math.floor(Math.random() * s.cols);
        liveRef.current.add(keyOf(s.cols, r, c));
      }

      for (let i = 0; i < blobs; i++) {
        if (Math.random() > p) continue;

        const r0 = Math.floor(Math.random() * s.rows);
        const c0 = Math.floor(Math.random() * s.cols);
        const size = clamp(s.blobSize, 1, 20);

        if (s.blobShape === 'circle') {
          const rad = size;
          for (let dr = -rad; dr <= rad; dr++) {
            for (let dc = -rad; dc <= rad; dc++) {
              if (dr * dr + dc * dc > rad * rad) continue;
              addLive(r0 + dr, c0 + dc);
            }
          }
        } else {
          for (let dr = 0; dr < size; dr++) {
            for (let dc = 0; dc < size; dc++) {
              addLive(r0 + dr, c0 + dc);
            }
          }
        }
      }
    };

    applyNoise();

    const counts = new Map<number, number>();

    const addCount = (r: number, c: number) => {
      let rr = r;
      let cc = c;
      if (s.wrap) {
        rr = (rr + s.rows) % s.rows;
        cc = (cc + s.cols) % s.cols;
      } else {
        if (rr < 0 || rr >= s.rows || cc < 0 || cc >= s.cols) return;
      }

      const k = keyOf(s.cols, rr, cc);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    };

    for (const k of liveRef.current) {
      const [r, c] = rcOf(s.cols, k);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          addCount(r + dr, c + dc);
        }
      }
    }

    const next = new Set<number>();
    for (const [k, n] of counts.entries()) {
      const alive = liveRef.current.has(k);
      if (alive) {
        if (n === 2 || n === 3) next.add(k);
      } else {
        if (n === 3) next.add(k);
      }
    }

    liveRef.current = next;
    setLiveCount(next.size);
    setGeneration((g) => g + 1);
    bumpDraw();
  }, [bumpDraw]);

  const startTimer = useCallback(() => {
    stopTimer();
    const speed = clamp(settingsRef.current.speedMs, 10, 400);
    timerRef.current = window.setInterval(stepOnceInternal, speed);
  }, [stepOnceInternal, stopTimer]);

  useEffect(() => {
    if (!running) {
      stopTimer();
      return;
    }

    startTimer();
    return () => stopTimer();
  }, [running, startTimer, stopTimer]);

  useEffect(() => {
    if (!running) return;
    startTimer();
  }, [running, settings.speedMs, startTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const toggleRunning = useCallback(() => {
    setRunningState((x) => !x);
  }, []);

  const stepOnce = useCallback(() => {
    if (running) return;
    stepOnceInternal();
  }, [running, stepOnceInternal]);

  const clearAll = useCallback(() => {
    liveRef.current.clear();
    setLiveCount(0);
    setGeneration(0);
    bumpDraw();
  }, [bumpDraw]);

  const randomize = useCallback(() => {
    const s = settingsRef.current;
    const p = clamp(s.density, 0, 1);

    const next = new Set<number>();
    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        if (Math.random() < p) next.add(keyOf(s.cols, r, c));
      }
    }

    liveRef.current = next;
    setLiveCount(next.size);
    setGeneration(0);
    bumpDraw();
  }, [bumpDraw]);

  const placePattern = useCallback(
    (pattern: string[], top: number, left: number) => {
      const s = settingsRef.current;

      const addLive = (r: number, c: number) => {
        let rr = r;
        let cc = c;
        if (s.wrap) {
          rr = (rr + s.rows) % s.rows;
          cc = (cc + s.cols) % s.cols;
        } else {
          if (rr < 0 || rr >= s.rows || cc < 0 || cc >= s.cols) return;
        }

        liveRef.current.add(keyOf(s.cols, rr, cc));
      };

      for (let pr = 0; pr < pattern.length; pr++) {
        const line = pattern[pr];
        for (let pc = 0; pc < line.length; pc++) {
          if (line[pc] !== '#') continue;
          addLive(top + pr, left + pc);
        }
      }

      setLiveCount(liveRef.current.size);
      bumpDraw();
    },
    [bumpDraw]
  );

  const centerPlace = useCallback(
    (pattern: string[]) => {
      const s = settingsRef.current;
      const h = pattern.length;
      const w = Math.max(...pattern.map((line) => line.length));
      const top = Math.floor((s.rows - h) / 2);
      const left = Math.floor((s.cols - w) / 2);
      placePattern(pattern, top, left);
    },
    [placePattern]
  );

  const paintCell = useCallback(
    (r: number, c: number, mode: PaintMode) => {
      const s = settingsRef.current;
      if (r < 0 || r >= s.rows || c < 0 || c >= s.cols) return;

      const k = keyOf(s.cols, r, c);
      if (mode === 'add') liveRef.current.add(k);
      else liveRef.current.delete(k);

      setLiveCount(liveRef.current.size);
      bumpDraw();
    },
    [bumpDraw]
  );

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    const prev = settingsRef.current;

    const next: GameSettings = {
      ...prev,
      ...patch,
      rows: clamp(Number(patch.rows ?? prev.rows) || prev.rows, 10, 1000),
      cols: clamp(Number(patch.cols ?? prev.cols) || prev.cols, 10, 1000),
      cellSize: clamp(Number(patch.cellSize ?? prev.cellSize) || prev.cellSize, 4, 20),
      speedMs: clamp(Number(patch.speedMs ?? prev.speedMs) || prev.speedMs, 10, 400),
      density: clamp(Number(patch.density ?? prev.density) || prev.density, 0, 1),
      noiseIntensity: clamp(Number(patch.noiseIntensity ?? prev.noiseIntensity) || prev.noiseIntensity, 0, 1),
      blobSize: clamp(Number(patch.blobSize ?? prev.blobSize) || prev.blobSize, 1, 20),
    };

    const colsChanged = next.cols !== prev.cols;
    const rowsChanged = next.rows !== prev.rows;

    if (colsChanged || rowsChanged) {
      const remapped = new Set<number>();
      for (const k of liveRef.current) {
        const [r, c] = rcOf(prev.cols, k);
        if (r >= 0 && r < next.rows && c >= 0 && c < next.cols) {
          remapped.add(keyOf(next.cols, r, c));
        }
      }
      liveRef.current = remapped;
      setLiveCount(remapped.size);
      bumpDraw();
    }

    settingsRef.current = next;
    setSettingsState(next);
  }, [bumpDraw]);

  const api = useMemo<UseGameOfLifeResult>(
    () => ({
      settings,
      running,
      generation,
      liveCount,
      drawNonce,
      liveRef,

      setRunning,
      toggleRunning,
      stepOnce,

      clearAll,
      randomize,

      centerPlace,
      paintCell,

      setRows: (rows) => updateSettings({ rows }),
      setCols: (cols) => updateSettings({ cols }),
      setCellSize: (cellSize) => updateSettings({ cellSize }),

      setWrap: (wrap) => updateSettings({ wrap }),
      setShowGrid: (showGrid) => updateSettings({ showGrid }),

      setSpeedMs: (speedMs) => updateSettings({ speedMs }),
      setDensityPercent: (densityPercent) => updateSettings({ density: clamp(densityPercent / 100, 0, 1) }),

      setNoiseEnabled: (enabled) => updateSettings({ noiseEnabled: enabled }),
      setNoiseIntensityPercent: (noisePercent) => updateSettings({ noiseIntensity: clamp(noisePercent / 100, 0, 1) }),
      setBlobSize: (blobSize) => updateSettings({ blobSize }),
      setBlobShape: (shape) => updateSettings({ blobShape: shape }),
    }),
    [
      centerPlace,
      clearAll,
      drawNonce,
      generation,
      liveCount,
      paintCell,
      randomize,
      running,
      setRunning,
      settings,
      stepOnce,
      toggleRunning,
      updateSettings,
    ]
  );

  return api;
}
