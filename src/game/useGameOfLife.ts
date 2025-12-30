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

function annihilateOverlap(a: Set<number>, b: Set<number>, events?: number[]) {
  if (a.size === 0 || b.size === 0) return;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  for (const k of small) {
    if (!big.has(k)) continue;
    if (events) events.push(k);
    small.delete(k);
    big.delete(k);
  }
}

export type UseGameOfLifeResult = {
  settings: GameSettings;
  running: boolean;
  generation: number;
  liveCount: number;
  antiLiveCount: number;
  drawNonce: number;
  liveRef: MutableRefObject<Set<number>>;
  antiLiveRef: MutableRefObject<Set<number>>;
  annihilationNonce: number;
  annihilationRef: MutableRefObject<number[]>;

  setRunning: (on: boolean) => void;
  toggleRunning: () => void;
  stepOnce: () => void;

  clearAll: () => void;
  randomize: () => void;

  centerPlace: (pattern: string[]) => void;
  paintCell: (r: number, c: number, mode: PaintMode) => void;
  nucleateCells: (cells: Array<[number, number]>) => void;
  nucleateAntiCells: (cells: Array<[number, number]>) => void;

  setRows: (rows: number) => void;
  setCols: (cols: number) => void;
  setCellSize: (cellSize: number) => void;

  setWrap: (wrap: boolean) => void;
  setShowGrid: (showGrid: boolean) => void;

  setSpeedMs: (speedMs: number) => void;
  setDensityPercent: (densityPercent: number) => void;

  setMediumMode: (mode: GameSettings['mediumMode']) => void;
  setHopHz: (hz: number) => void;
  setHopStrength: (strength: number) => void;
  setNucleationThreshold: (threshold: number) => void;
  setAntiparticlesEnabled: (enabled: boolean) => void;

  setLakeNoiseEnabled: (enabled: boolean) => void;

  setMediumMemoryRatePercent: (percent: number) => void;
  setMediumMemoryCoupling: (value: number) => void;
  setMediumNonlinearity: (value: number) => void;
  setAnnihilationBurstPercent: (percent: number) => void;
  setLakeNoiseIntensityPercent: (noisePercent: number) => void;
  setLakeBlobSize: (blobSize: number) => void;
  setLakeBlobShape: (shape: GameSettings['lakeBlobShape']) => void;
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

    mediumMode: 'nucleation',
    hopHz: 4,
    hopStrength: 1,
    nucleationThreshold: 0.25,

    antiparticlesEnabled: true,

    mediumMemoryRate: 0.04,
    mediumMemoryCoupling: 10,
    mediumNonlinearity: 8,

    annihilationBurst: 0.25,

    // Lake noise (new background lake agitation)
    lakeNoiseEnabled: true,
    lakeNoiseIntensity: 0.04,
    lakeBlobSize: 4,
    lakeBlobShape: 'circle',
  });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const liveRef = useRef<Set<number>>(new Set());
  const antiLiveRef = useRef<Set<number>>(new Set());
  const [liveCount, setLiveCount] = useState(0);
  const [antiLiveCount, setAntiLiveCount] = useState(0);
  const [generation, setGeneration] = useState(0);
  const [running, setRunningState] = useState(false);
  const [drawNonce, setDrawNonce] = useState(0);
  const [annihilationNonce, setAnnihilationNonce] = useState(0);

  const annihilationRef = useRef<number[]>([]);

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

  const recordAnnihilations = useCallback((events: number[]) => {
    if (events.length === 0) return;
    annihilationRef.current.push(...events);
    setAnnihilationNonce((n) => n + 1);
  }, []);

  const stepOnceInternal = useCallback(() => {
    const s = settingsRef.current;

    const stepConway = (current: Set<number>) => {
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

      for (const k of current) {
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
        const alive = current.has(k);
        if (alive) {
          if (n === 2 || n === 3) next.add(k);
        } else {
          if (n === 3) next.add(k);
        }
      }

      return next;
    };


    const nextLive = stepConway(liveRef.current);
    const nextAnti = stepConway(antiLiveRef.current);

    const events: number[] = [];
    annihilateOverlap(nextLive, nextAnti, events);
    recordAnnihilations(events);

    liveRef.current = nextLive;
    antiLiveRef.current = nextAnti;

    setLiveCount(nextLive.size);
    setAntiLiveCount(nextAnti.size);
    setGeneration((g) => g + 1);
    bumpDraw();
  }, [bumpDraw, recordAnnihilations]);

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
    antiLiveRef.current.clear();
    setLiveCount(0);
    setAntiLiveCount(0);
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
    antiLiveRef.current.clear();

    setLiveCount(next.size);
    setAntiLiveCount(0);
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

      const events: number[] = [];
      annihilateOverlap(liveRef.current, antiLiveRef.current, events);
      recordAnnihilations(events);

      setLiveCount(liveRef.current.size);
      setAntiLiveCount(antiLiveRef.current.size);
      bumpDraw();
    },
    [bumpDraw, recordAnnihilations]
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

      annihilateOverlap(liveRef.current, antiLiveRef.current);

      setLiveCount(liveRef.current.size);
      setAntiLiveCount(antiLiveRef.current.size);
      bumpDraw();
    },
    [bumpDraw]
  );

  const nucleateCells = useCallback(
    (cells: Array<[number, number]>) => {
      if (cells.length === 0) return;
      const s = settingsRef.current;

      for (const [r, c] of cells) {
        let rr = r;
        let cc = c;
        if (s.wrap) {
          rr = (rr + s.rows) % s.rows;
          cc = (cc + s.cols) % s.cols;
        } else {
          if (rr < 0 || rr >= s.rows || cc < 0 || cc >= s.cols) continue;
        }
        liveRef.current.add(keyOf(s.cols, rr, cc));
      }

      const events: number[] = [];
      annihilateOverlap(liveRef.current, antiLiveRef.current, events);
      recordAnnihilations(events);

      setLiveCount(liveRef.current.size);
      setAntiLiveCount(antiLiveRef.current.size);
      bumpDraw();
    },
    [bumpDraw, recordAnnihilations]
  );

  const nucleateAntiCells = useCallback(
    (cells: Array<[number, number]>) => {
      if (cells.length === 0) return;
      const s = settingsRef.current;
      if (!s.antiparticlesEnabled) return;

      for (const [r, c] of cells) {
        let rr = r;
        let cc = c;
        if (s.wrap) {
          rr = (rr + s.rows) % s.rows;
          cc = (cc + s.cols) % s.cols;
        } else {
          if (rr < 0 || rr >= s.rows || cc < 0 || cc >= s.cols) continue;
        }
        antiLiveRef.current.add(keyOf(s.cols, rr, cc));
      }

      const events: number[] = [];
      annihilateOverlap(liveRef.current, antiLiveRef.current, events);
      recordAnnihilations(events);

      setLiveCount(liveRef.current.size);
      setAntiLiveCount(antiLiveRef.current.size);
      bumpDraw();
    },
    [bumpDraw, recordAnnihilations]
  );

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    const prev = settingsRef.current;

    const next: GameSettings = {
      ...prev,
      ...patch,
      rows: clamp(Number(patch.rows ?? prev.rows), 10, 1000),
      cols: clamp(Number(patch.cols ?? prev.cols), 10, 1000),
      cellSize: clamp(Number(patch.cellSize ?? prev.cellSize), 4, 20),
      speedMs: clamp(Number(patch.speedMs ?? prev.speedMs), 10, 400),
      density: clamp(Number(patch.density ?? prev.density), 0, 1),

      hopHz: clamp(Number(patch.hopHz ?? prev.hopHz), 0, 20),
      hopStrength: clamp(Number(patch.hopStrength ?? prev.hopStrength), 0, 3),
      nucleationThreshold: clamp(Number(patch.nucleationThreshold ?? prev.nucleationThreshold), 0.01, 2),

      mediumMemoryRate: clamp(Number(patch.mediumMemoryRate ?? prev.mediumMemoryRate), 0, 0.3),
      mediumMemoryCoupling: clamp(Number(patch.mediumMemoryCoupling ?? prev.mediumMemoryCoupling), 0, 60),
      mediumNonlinearity: clamp(Number(patch.mediumNonlinearity ?? prev.mediumNonlinearity), 0, 60),
      annihilationBurst: clamp(Number(patch.annihilationBurst ?? prev.annihilationBurst), 0, 1),

      lakeNoiseIntensity: clamp(Number(patch.lakeNoiseIntensity ?? prev.lakeNoiseIntensity), 0, 1),
      lakeBlobSize: clamp(Number(patch.lakeBlobSize ?? prev.lakeBlobSize), 1, 20),
    };

    const colsChanged = next.cols !== prev.cols;
    const rowsChanged = next.rows !== prev.rows;
    const antiparticlesTurningOff = prev.antiparticlesEnabled && !next.antiparticlesEnabled;

    if (colsChanged || rowsChanged) {
      const remap = (set: Set<number>) => {
        const remapped = new Set<number>();
        for (const k of set) {
          const [r, c] = rcOf(prev.cols, k);
          if (r >= 0 && r < next.rows && c >= 0 && c < next.cols) {
            remapped.add(keyOf(next.cols, r, c));
          }
        }
        return remapped;
      };

      liveRef.current = remap(liveRef.current);
      antiLiveRef.current = remap(antiLiveRef.current);
    }

    if (antiparticlesTurningOff) {
      antiLiveRef.current.clear();
    }

    const events: number[] = [];
    annihilateOverlap(liveRef.current, antiLiveRef.current, events);
    recordAnnihilations(events);

    setLiveCount(liveRef.current.size);
    setAntiLiveCount(antiLiveRef.current.size);

    if (colsChanged || rowsChanged || antiparticlesTurningOff || events.length > 0) bumpDraw();

    settingsRef.current = next;
    setSettingsState(next);
  }, [bumpDraw, recordAnnihilations]);

  const api = useMemo<UseGameOfLifeResult>(
    () => ({
      settings,
      running,
      generation,
      liveCount,
      antiLiveCount,
      drawNonce,
      liveRef,
      antiLiveRef,
      annihilationNonce,
      annihilationRef,

      setRunning,
      toggleRunning,
      stepOnce,

      clearAll,
      randomize,

      centerPlace,
      paintCell,
      nucleateCells,
      nucleateAntiCells,

      setRows: (rows) => updateSettings({ rows }),
      setCols: (cols) => updateSettings({ cols }),
      setCellSize: (cellSize) => updateSettings({ cellSize }),

      setWrap: (wrap) => updateSettings({ wrap }),
      setShowGrid: (showGrid) => updateSettings({ showGrid }),

      setSpeedMs: (speedMs) => updateSettings({ speedMs }),
      setDensityPercent: (densityPercent) => updateSettings({ density: clamp(densityPercent / 100, 0, 1) }),

      setMediumMode: (mode) => {
        const prev = settingsRef.current;
        const patch: Partial<GameSettings> = { mediumMode: mode };

        if (mode === 'nucleation') {
          patch.lakeNoiseEnabled = true;
          if (prev.lakeNoiseIntensity <= 0) patch.lakeNoiseIntensity = 0.08;
        }

        updateSettings(patch);
      },
      setHopHz: (hz) => updateSettings({ hopHz: hz }),
      setHopStrength: (strength) => updateSettings({ hopStrength: strength }),
      setNucleationThreshold: (threshold) => updateSettings({ nucleationThreshold: threshold }),
      setAntiparticlesEnabled: (enabled) => updateSettings({ antiparticlesEnabled: enabled }),

      setLakeNoiseEnabled: (enabled) => updateSettings({ lakeNoiseEnabled: enabled }),
      setLakeNoiseIntensityPercent: (noisePercent) =>
        updateSettings({ lakeNoiseIntensity: clamp(noisePercent / 100, 0, 1) }),
      setLakeBlobSize: (blobSize) => updateSettings({ lakeBlobSize: blobSize }),
      setLakeBlobShape: (shape) => updateSettings({ lakeBlobShape: shape }),

      setMediumMemoryRatePercent: (percent) => updateSettings({ mediumMemoryRate: clamp(percent / 100, 0, 0.3) }),
      setMediumMemoryCoupling: (value) => updateSettings({ mediumMemoryCoupling: value }),
      setMediumNonlinearity: (value) => updateSettings({ mediumNonlinearity: value }),
      setAnnihilationBurstPercent: (percent) => updateSettings({ annihilationBurst: clamp(percent / 100, 0, 1) }),
    }),
    [
      centerPlace,
      clearAll,
      drawNonce,
      generation,
      liveCount,
      antiLiveCount,
      annihilationNonce,
      nucleateCells,
      nucleateAntiCells,
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
