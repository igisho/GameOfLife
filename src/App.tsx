import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LifeCanvas, { type MediumPreviewFrame } from './components/LifeCanvas';
import MediumLake3DPreview from './components/MediumLake3DPreview';
import HolographicConway3DPreview from './components/HolographicConway3DPreview';
import Sidebar from './components/Sidebar';
import StartOverlay from './components/StartOverlay';
import Button from './components/ui/Button';
import { useGameOfLife } from './game/useGameOfLife';
import { BLINKER, START_L3, START_SHIFTED_2X2 } from './game/patterns';
import { cn } from './lib/cn';
import { applyTheme, type ThemeName } from './lib/themes';
import { useI18n } from './i18n/I18nProvider';
import Tooltip from './components/ui/Tooltip';

function formatCount(n: number) {
  const v = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
  if (v < 1000) return String(v);

  const units = [
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'k' },
  ];

  for (const u of units) {
    if (v >= u.value) {
      const raw = v / u.value;
      const digits = raw < 10 ? 1 : 0;
      const s = raw.toFixed(digits).replace(/\.0$/, '');
      return `${s}${u.suffix}`;
    }
  }

  return String(v);
}

function formatSigned(x: number) {
  const v = Number.isFinite(x) ? x : 0;
  const abs = Math.abs(v);
  if (abs < 0.001) return '0';
  const sign = v > 0 ? '+' : '-';
  const s = abs.toFixed(3).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  return `${sign}${s}`;
}

function formatMagnitude(x: number) {
  const v = Number.isFinite(x) ? Math.abs(x) : 0;
  if (v < 0.001) return '0';
  if (v >= 1000) return v.toFixed(0);
  if (v >= 10) return v.toFixed(2).replace(/(\.\d*?)0+$/, '$1');
  return v.toFixed(3).replace(/(\.\d*?)0+$/, '$1');
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
  return target.isContentEditable;
}


type ParsedDualAsciiPattern = {
  width: number;
  height: number;
  liveCells: Array<[number, number]>;
  antiCells: Array<[number, number]>;
};

function parseDualAsciiPattern(pattern: string[]): ParsedDualAsciiPattern {
  const height = pattern.length;
  let width = 0;
  for (const row of pattern) width = Math.max(width, row.length);

  const liveCells: Array<[number, number]> = [];
  const antiCells: Array<[number, number]> = [];

  for (let r = 0; r < height; r++) {
    const row = pattern[r] ?? '';
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (cell === 'O' || cell === '#') liveCells.push([r, c]);
      else if (cell === 'A' || cell === '@') antiCells.push([r, c]);
    }
  }

  return { width, height, liveCells, antiCells };
}

export default function App() {
  const game = useGameOfLife();
  const { t } = useI18n();
  const [theme, setTheme] = useState<ThemeName>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [startOverlayOpen, setStartOverlayOpen] = useState(true);

  const canvasScrollRef = useRef<HTMLDivElement | null>(null);

  const [mediumAvg, setMediumAvg] = useState(0);
  const [mediumPreview, setMediumPreview] = useState<MediumPreviewFrame | null>(null);
  const [mediumPreviewOpen, setMediumPreviewOpen] = useState(false);
  const [mediumPreviewTab, setMediumPreviewTab] = useState<'surface' | 'holographic'>('surface');

  const [liveSeries, setLiveSeries] = useState<number[]>(() => Array.from({ length: 64 }, () => 0));
  const [antiSeries, setAntiSeries] = useState<number[]>(() => Array.from({ length: 64 }, () => 0));

  const liveNow = liveSeries[liveSeries.length - 1] ?? 0;
  const antiNow = antiSeries[antiSeries.length - 1] ?? 0;

  const onMediumAvgAmplitude = useCallback((avg: number) => {
    setMediumAvg(avg);
  }, []);

  const onMediumPreview = useCallback((frame: MediumPreviewFrame | null) => {
    setMediumPreview(frame);
  }, []);

  useEffect(() => {
    // Sample cell counts whenever the simulation redraws.
    setLiveSeries((prev) => {
      const next = prev.length >= 64 ? prev.slice(1) : prev.slice();
      next.push(game.liveCount);
      return next;
    });

    setAntiSeries((prev) => {
      const next = prev.length >= 64 ? prev.slice(1) : prev.slice();
      next.push(game.antiLiveCount);
      return next;
    });
  }, [game.antiLiveCount, game.drawNonce, game.liveCount]);

  const { livePoints, antiPoints } = useMemo(() => {
    const w = 120;
    const h = 22;

    const build = (values: number[]) => {
      const n = values.length;
      if (n < 2) return '';

      let max = 0;
      for (const v of values) max = Math.max(max, Number.isFinite(v) ? v : 0);
      max = Math.max(1, max);

      const pts: string[] = [];
      for (let i = 0; i < n; i++) {
        const v = Number.isFinite(values[i]) ? Math.max(0, values[i] ?? 0) : 0;
        const x = (i / (n - 1)) * w;
        const y = h - (v / max) * (h - 2) - 1;
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      return pts.join(' ');
    };

    return {
      livePoints: build(liveSeries),
      antiPoints: build(antiSeries),
    };
  }, [antiSeries, liveSeries]);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (startOverlayOpen) return;
      if (isTypingTarget(e.target)) return;

      if (e.code === 'Escape') {
        e.preventDefault();
        setSidebarOpen(false);
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        game.toggleRunning();
      }

      if (e.code === 'Enter') {
        e.preventDefault();
        game.stepOnce();
      }

      if (e.key.toLowerCase() === 'r') game.randomize();
      if (e.key.toLowerCase() === 'c') game.clearAll();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game, startOverlayOpen]);

  useEffect(() => {
     if (!mediumPreviewOpen) return;
     if (game.settings.mediumMode === 'off') {
       setMediumPreviewOpen(false);
       return;
     }

     // Keep the default tab consistent.
     setMediumPreviewTab('surface');


    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setMediumPreviewOpen(false);
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter' || key === 'r' || key === 'c') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      document.body.style.overflow = prevOverflow;
    };
  }, [game.settings.mediumMode, mediumPreviewOpen]);

  const BLINKER_PAIR: string[] = ['OOO', 'AAA'];
  const L3_PAIR: string[] = ['XOO', 'AXO', 'AAX'];
  const DOUBLE_BLOCK_PAIR: string[] = ['XOOX', 'XXOO', 'AAXX', 'XAAX'];

  type StartOption = {
    id: string;
    title: string;
    subtitle: string;
    // Pattern used only for UI preview tiles.
    pattern: string[];
    // Pattern seeded as live-only into the Conway grid.
    livePattern?: string[];
    // Pattern seeded as live + anti into the Conway grid.
    dualPattern?: string[];
  };

  const startOptions = useMemo<StartOption[]>(
    () => [
      {
        id: 'blinker',
        title: t('start.pattern.blinker'),
        subtitle: t('start.pattern.blinker.subtitle'),
        pattern: BLINKER,
        livePattern: BLINKER,
      },
      {
        id: 'l3',
        title: t('start.pattern.l3'),
        subtitle: t('start.pattern.l3.subtitle'),
        pattern: START_L3,
        livePattern: START_L3,
      },
      {
        id: 'shifted',
        title: t('start.pattern.doubleBlock'),
        subtitle: t('start.pattern.doubleBlock.subtitle'),
        pattern: START_SHIFTED_2X2,
        livePattern: START_SHIFTED_2X2,
      },
      {
        id: 'blinker_pair',
        title: t('start.pattern.blinkerPair'),
        subtitle: t('start.pattern.blinkerPair.subtitle'),
        pattern: BLINKER_PAIR,
        dualPattern: BLINKER_PAIR,
      },
      {
        id: 'l3_pair',
        title: t('start.pattern.l3Pair'),
        subtitle: t('start.pattern.l3Pair.subtitle'),
        pattern: L3_PAIR,
        dualPattern: L3_PAIR,
      },
      {
        id: 'shifted_pair',
        title: t('start.pattern.doubleBlockPair'),
        subtitle: t('start.pattern.doubleBlockPair.subtitle'),
        pattern: DOUBLE_BLOCK_PAIR,
        dualPattern: DOUBLE_BLOCK_PAIR,
      },
    ],
    [t]
  );

  const centerCanvasScroll = useCallback(() => {
    const el = canvasScrollRef.current;
    if (!el) return;

    const contentW = game.settings.cols * game.settings.cellSize;
    const contentH = game.settings.rows * game.settings.cellSize;

    const left = Math.max(0, Math.floor(contentW / 2 - el.clientWidth / 2));
    const top = Math.max(0, Math.floor(contentH / 2 - el.clientHeight / 2));

    el.scrollTo({ left, top, behavior: 'smooth' });
  }, [game.settings.cellSize, game.settings.cols, game.settings.rows]);

  const startWithDualPattern = useCallback(
    (pattern: string[]) => {
      const s = game.settings;
      const { width, height, liveCells, antiCells } = parseDualAsciiPattern(pattern);
      if (liveCells.length === 0 && antiCells.length === 0) return;

      game.clearAll();
      if (!s.antiparticlesEnabled) game.setAntiparticlesEnabled(true);

      const top = Math.floor(s.rows / 2 - height / 2);
      const left = Math.floor(s.cols / 2 - width / 2);

      if (liveCells.length > 0) {
        game.nucleateCells(liveCells.map(([r, c]) => [top + r, left + c] as [number, number]));
      }
      if (antiCells.length > 0) {
        game.nucleateAntiCells(antiCells.map(([r, c]) => [top + r, left + c] as [number, number]));
      }

      game.setRunning(true);
    },
    [game]
  );

  const onSelectStartPattern = useCallback(
    (id: string) => {
      const opt = startOptions.find((o) => o.id === id);
      if (!opt) return;

      setStartOverlayOpen(false);
      setSidebarOpen(false);

      if (opt.dualPattern) startWithDualPattern(opt.dualPattern);
      else if (opt.livePattern) game.startWithPattern(opt.livePattern);

      window.requestAnimationFrame(() => centerCanvasScroll());
    },
    [centerCanvasScroll, game, startOptions, startWithDualPattern]
  );

  const onQuickStartFromSidebar = useCallback(
    (id: string) => {
      const opt = startOptions.find((o) => o.id === id);
      if (!opt) return;

      if (opt.dualPattern) startWithDualPattern(opt.dualPattern);
      else if (opt.livePattern) game.startWithPattern(opt.livePattern);

      window.requestAnimationFrame(() => centerCanvasScroll());
    },
    [centerCanvasScroll, game, startOptions, startWithDualPattern]
  );

  const onAdvancedStart = useCallback(() => {
    setStartOverlayOpen(false);
    setSidebarOpen(true);
  }, []);

  const mediumPreviewModal = mediumPreviewOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('app.medium')}
        >
          <div
            className="absolute inset-0 bg-black/60"
            onMouseDown={() => setMediumPreviewOpen(false)}
            aria-hidden="true"
          />

<div
             className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[980px] flex-col overflow-visible rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] shadow-lg"
             onMouseDown={(e) => e.stopPropagation()}
           >
             <div className="flex items-center justify-between gap-3 border-b border-[var(--panel-border)] p-4">
               <div className="min-w-0">
                 <div className="text-sm font-semibold">{t('app.medium')}</div>
               </div>

                <div className="flex items-center gap-2">
                  {mediumPreviewTab === 'holographic' ? (
                    <Tooltip label={t('holographic.header.help')} side="bottom" sideOffset={10}>
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--field)] text-xs font-semibold opacity-80"
                        aria-label={t('holographic.header.aria')}
                      >
                        i
                      </span>
                    </Tooltip>
                  ) : null}

                  <div className="inline-flex rounded-full border border-[var(--panel-border)] bg-[var(--field)] p-1">
                   <button
                     type="button"
                     className={cn(
                       'h-8 rounded-full px-3 text-xs font-medium transition-colors',
                       mediumPreviewTab === 'surface' ? 'bg-[var(--panel)]' : 'opacity-70 hover:opacity-100'
                     )}
                     onClick={() => setMediumPreviewTab('surface')}
                   >
                     {t('app.mediumPreview.tab.surface')}
                   </button>
                   <button
                     type="button"
                     className={cn(
                       'h-8 rounded-full px-3 text-xs font-medium transition-colors',
                       mediumPreviewTab === 'holographic' ? 'bg-[var(--panel)]' : 'opacity-70 hover:opacity-100'
                     )}
                     onClick={() => setMediumPreviewTab('holographic')}
                   >
                     {t('app.mediumPreview.tab.holographic')}
                   </button>
                 </div>

                 <Button
                   className="h-9 w-9 rounded-full p-0"
                   onClick={() => setMediumPreviewOpen(false)}
                   aria-label={t('common.close')}
                 >
                   <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                     <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                   </svg>
                 </Button>
               </div>
             </div>
 
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {mediumPreviewTab === 'surface' ? (
                  <div className="aspect-[16/10] w-full">
                    <MediumLake3DPreview
                      renderer="webgl"
                      enabled={game.settings.mediumMode !== 'off'}
                      frame={mediumPreview}
                      className="h-full w-full overflow-hidden rounded-xl border border-[var(--panel-border)]"
                    />
                  </div>
                ) : (
                  <HolographicConway3DPreview
                    renderer="webgl"
                    enabled={game.settings.mediumMode !== 'off'}
                    frame={mediumPreview}
                    className="w-full rounded-xl border border-[var(--panel-border)]"
                    viewMode={game.settings.holographicViewMode}
                    orbit={{ yaw: 0.35, pitch: 0.25, zoom: 0.92 }}
                    tuning={{
                      steps: game.settings.holographicSteps,
                      gridN: game.settings.holographicGridN,
                      thr: game.settings.holographicThr,
                      gamma: game.settings.holographicGamma,
                      k: game.settings.holographicK,
                      phaseGain: game.settings.holographicPhaseGain,
                      exposureBoost: game.settings.holographicExposureBoost,
                      feedbackStable: game.settings.holographicFeedbackStable,
                      feedbackTurb: game.settings.holographicFeedbackTurb,
                      deltaGain: game.settings.holographicDeltaGain,
                      sphereR: game.settings.holographicSphereR,
                      sphereFade: game.settings.holographicSphereFade,
                    }}
                    onOrbitChange={() => {}}
                  />
                )}


               {mediumPreview && mediumPreviewTab === 'surface' ? (
                 <div className="mt-3 rounded-xl border border-[var(--panel-border)] bg-[var(--field)] p-3 text-xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{t('medium.legend.title')}</div>
                  <div className="mt-1 tabular-nums opacity-90">
                    {t('medium.legend.body', {
                      p95: formatMagnitude(mediumPreview.absP95),
                      p99: formatMagnitude(mediumPreview.absP99),
                      max: formatMagnitude(mediumPreview.absMax),
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative h-full min-h-0 p-4">
      {mediumPreviewModal}
       {!sidebarOpen && !startOverlayOpen ? (

        <div className="absolute left-6 top-6 z-40">
          <Button
            className="h-10 w-10 rounded-full p-0"
            onClick={() => setSidebarOpen(true)}
            aria-label={t('app.openMenu')}
            aria-expanded={false}
            aria-controls="sidebar-drawer"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path
                d="M4 7H20M4 12H20M4 17H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </Button>
        </div>
      ) : null}

       {sidebarOpen ? (
         <button
           type="button"
           className="fixed inset-0 z-20 bg-black/40 md:hidden"
           onClick={() => setSidebarOpen(false)}
            aria-label={t('app.closeMenu')}
         />
       ) : null}

       <div className={cn('flex h-full min-h-0', sidebarOpen ? 'gap-4' : 'gap-0')}>
         <div
           id="sidebar-drawer"
           className={cn(
             'h-full overflow-hidden transition-[width] duration-300 ease-out md:relative md:z-30',
             sidebarOpen
               ? 'fixed inset-0 z-30 w-screen max-w-[100vw] md:static md:inset-auto md:w-[450px] md:max-w-none'
               : 'w-0 pointer-events-none'
           )}
           aria-hidden={!sidebarOpen}
         >
           <div
             className={cn(
               'h-full transition-transform duration-300 ease-out',
               sidebarOpen ? 'translate-x-0' : '-translate-x-full'
             )}
           >
              <Sidebar
                game={game}
                theme={theme}
                setTheme={setTheme}
                onHide={() => setSidebarOpen(false)}
                quickStartOptions={startOptions}
                onQuickStart={onQuickStartFromSidebar}
              />
           </div>
         </div>
 
         <main className={cn('h-full min-h-0 min-w-0 flex-1', sidebarOpen ? 'hidden md:block' : '')}>

            <div className="relative h-full overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--canvas)] shadow-lg [--tw-shadow-color:var(--shadow-color)] [--tw-shadow:var(--tw-shadow-colored)]">
               <div className="pointer-events-none absolute bottom-4 left-4 z-10">
                 <span className="inline-flex rounded-full border border-[var(--pill-border)] bg-[var(--field)] px-2 py-1 text-xs font-medium opacity-90">
                    {game.running ? t('app.status.running') : t('app.status.paused')}
                 </span>
               </div>

               {!sidebarOpen && !startOverlayOpen ? (
                 <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
                   <Button
                     className="h-12 w-12 rounded-full border border-[var(--pill-border)] p-0 text-white shadow-lg hover:bg-black/50 [--tw-shadow-color:var(--shadow-color)] [--tw-shadow:var(--tw-shadow-colored)]"
                     style={{ backgroundColor: 'color-mix(in srgb, var(--panel) 82%, transparent)' }}
                     onClick={() => game.toggleRunning()}
                      aria-label={game.running ? t('app.pause') : t('app.play')}
                   >
                     {game.running ? (
                       <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                         <path d="M7 6h3v12H7V6zm7 0h3v12h-3V6z" fill="currentColor" />
                       </svg>
                     ) : (
                       <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                         <path d="M8 5v14l12-7L8 5z" fill="currentColor" />
                       </svg>
                     )}
                   </Button>
                 </div>
               ) : null}


              <div className="pointer-events-none absolute right-4 top-4 space-y-2" style={{ zIndex: 49 }}>
                <div
                  className="w-[200px] overflow-hidden rounded-xl border border-[var(--panel-border)] px-3 py-2 text-xs font-medium"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--panel) 88%, transparent)' }}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{t('app.medium')}</div>
                  <div className="relative mt-2">
                    <MediumLake3DPreview
                      enabled={game.settings.mediumMode !== 'off'}
                      frame={mediumPreview}
                      className="block h-[92px] w-full overflow-hidden rounded-md"
                    />
                    {game.settings.mediumMode !== 'off' ? (
                      <button
                        type="button"
                        className="pointer-events-auto absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--panel-border)] bg-[var(--field)] text-[var(--text)] opacity-80 shadow-sm transition-opacity hover:opacity-100"
                        onClick={() => setMediumPreviewOpen(true)}
                        aria-label={t('app.mediumPreview.expand')}
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                          <path d="M9 3H3v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M3 3l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M15 21h6v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M21 21l-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    ) : null}
                  </div>

                 <div className="mt-1 flex items-center justify-between gap-2 tabular-nums opacity-90">
                   <div className="flex min-w-0 flex-1 items-center gap-1">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 opacity-80" aria-label={t('app.generation')}>
                        <title>{t('app.generation')}</title>
                       <path
                         d="M21 12a9 9 0 1 1-3.2-6.9"
                         fill="none"
                         stroke="currentColor"
                         strokeWidth="2"
                         strokeLinecap="round"
                       />
                       <path
                         d="M21 4v6h-6"
                         fill="none"
                         stroke="currentColor"
                         strokeWidth="2"
                         strokeLinecap="round"
                         strokeLinejoin="round"
                       />
                     </svg>
                     <span className="w-[52px] text-right">{formatCount(game.generation)}</span>
                   </div>
 
                   <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 opacity-80" aria-label={t('app.mediumAvgAmplitude')}>
                        <title>{t('app.mediumAvgAmplitude')}</title>
                       <path
                         d="M2 12c3 0 3-6 6-6s3 12 6 12 3-6 6-6"
                         fill="none"
                         stroke="currentColor"
                         strokeWidth="2"
                         strokeLinecap="round"
                         strokeLinejoin="round"
                       />
                     </svg>
                     <span className="w-[52px] text-right">{formatSigned(mediumAvg)}</span>
                   </div>
                 </div>
               </div>

               <div
                 className="w-[200px] overflow-hidden rounded-xl border border-[var(--panel-border)] px-3 py-2 text-xs font-medium"
                 style={{ backgroundColor: 'color-mix(in srgb, var(--panel) 88%, transparent)' }}
               >
                  <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{t('app.cellCounts')}</div>

                 <div className="mt-2 space-y-2 tabular-nums">
                   <div className="flex items-center justify-between gap-2">
                     <svg viewBox="0 0 120 22" width={120} height={22} className="block" aria-hidden="true">
                       <line x1={0} y1={21} x2={120} y2={21} stroke="var(--grid)" strokeWidth={1} opacity={0.35} />
                       <polyline
                         points={livePoints}
                         fill="none"
                         stroke="var(--cell)"
                         strokeWidth={1.6}
                         strokeLinejoin="round"
                         strokeLinecap="round"
                         opacity={0.95}
                       />
                     </svg>
                      <span className="w-[52px] text-right" title={t('app.liveCellsTitle')}>{formatCount(liveNow)}</span>
                   </div>

                   <div className="flex items-center justify-between gap-2">
                     <svg viewBox="0 0 120 22" width={120} height={22} className="block" aria-hidden="true">
                       <line x1={0} y1={21} x2={120} y2={21} stroke="var(--grid)" strokeWidth={1} opacity={0.35} />
                       <polyline
                         points={antiPoints}
                         fill="none"
                         stroke="var(--anti-cell)"
                         strokeWidth={1.6}
                         strokeLinejoin="round"
                         strokeLinecap="round"
                         opacity={0.95}
                       />
                     </svg>
                      <span className="w-[52px] text-right" title={t('app.antiCellsTitle')}>{formatCount(antiNow)}</span>
                   </div>
                 </div>
               </div>
             </div>

             <div ref={canvasScrollRef} className="h-full overflow-auto">
                  <LifeCanvas
 
                   settings={game.settings}
                   liveRef={game.liveRef}
                   antiLiveRef={game.antiLiveRef}
                   annihilationRef={game.annihilationRef}
                   annihilationNonce={game.annihilationNonce}
                   generation={game.generation}
                   drawNonce={game.drawNonce}
                   resetNonce={game.resetNonce}
                   theme={theme}
 
                 onPaintCell={game.paintCell}
                onNucleateCells={game.nucleateCells}
                onNucleateAntiCells={game.nucleateAntiCells}
                 onMediumAvgAmplitude={onMediumAvgAmplitude}
                 onMediumPreview={onMediumPreview}
                />

             </div>

             <StartOverlay
               open={startOverlayOpen}
               options={startOptions}
               onSelect={onSelectStartPattern}
               onAdvancedStart={onAdvancedStart}
             />
           </div>
         </main>

      </div>
    </div>
  );
}
