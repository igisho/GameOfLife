import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

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
import LifeCanvas from './components/LifeCanvas';
import Sidebar from './components/Sidebar';
import StartOverlay from './components/StartOverlay';
import Button from './components/ui/Button';
import { useGameOfLife } from './game/useGameOfLife';
import { BLINKER, START_L3, START_SHIFTED_2X2 } from './game/patterns';
import { cn } from './lib/cn';
import { applyTheme, type ThemeName } from './lib/themes';

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
  return target.isContentEditable;
}

export default function App() {
  const game = useGameOfLife();
  const [theme, setTheme] = useState<ThemeName>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [startOverlayOpen, setStartOverlayOpen] = useState(true);

  const canvasScrollRef = useRef<HTMLDivElement | null>(null);

  const [mediumSeries, setMediumSeries] = useState<number[]>(() => Array.from({ length: 64 }, () => 0));
  const [liveSeries, setLiveSeries] = useState<number[]>(() => Array.from({ length: 64 }, () => 0));
  const [antiSeries, setAntiSeries] = useState<number[]>(() => Array.from({ length: 64 }, () => 0));

  const mediumAvg = mediumSeries[mediumSeries.length - 1] ?? 0;
  const liveNow = liveSeries[liveSeries.length - 1] ?? 0;
  const antiNow = antiSeries[antiSeries.length - 1] ?? 0;

  const onMediumAvgAmplitude = useCallback((avg: number) => {
    setMediumSeries((prev) => {
      const next = prev.length >= 64 ? prev.slice(1) : prev.slice();
      next.push(avg);
      return next;
    });
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

  const { mediumPosSegments, mediumNegSegments, mediumMidY } = useMemo(() => {
    const w = 120;
    const h = 34;

    const values = mediumSeries;
    const n = values.length;
    if (n < 2) return { mediumPosSegments: [] as string[], mediumNegSegments: [] as string[], mediumMidY: h / 2 };

    let maxAbs = 0;
    for (const v of values) {
      maxAbs = Math.max(maxAbs, Math.abs(v));
    }
    maxAbs = Math.max(1e-6, maxAbs);

    const midY = h / 2;

    const posSegments: string[] = [];
    const negSegments: string[] = [];

    let current: string[] = [];
    let currentSign: 'pos' | 'neg' | null = null;

    const flush = () => {
      if (current.length < 2 || !currentSign) {
        current = [];
        currentSign = null;
        return;
      }
      const s = current.join(' ');
      if (currentSign === 'pos') posSegments.push(s);
      else negSegments.push(s);
      current = [];
      currentSign = null;
    };

    for (let i = 0; i < n; i++) {
      const v = values[i] ?? 0;
      const x = (i / (n - 1)) * w;
      const y = midY - (v / maxAbs) * (h / 2);

      const sign = v >= 0 ? 'pos' : 'neg';
      const pt = `${x.toFixed(1)},${y.toFixed(1)}`;

      if (currentSign === null) {
        currentSign = sign;
        current.push(pt);
        continue;
      }

      if (sign !== currentSign) {
        flush();
        currentSign = sign;
      }

      current.push(pt);
    }

    flush();

    return { mediumPosSegments: posSegments, mediumNegSegments: negSegments, mediumMidY: midY };
  }, [mediumSeries]);

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

  const startOptions = useMemo(
    () => [
      { id: 'blinker', title: 'OOO', subtitle: '3 v rade', pattern: BLINKER },
      { id: 'l3', title: 'L', subtitle: 'OO / .O', pattern: START_L3 },
      { id: 'shifted', title: 'Dvojblok', subtitle: 'OO / .OO', pattern: START_SHIFTED_2X2 },
    ],
    []
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

  const onSelectStartPattern = useCallback(
    (id: string) => {
      const opt = startOptions.find((o) => o.id === id);
      if (!opt) return;

      setStartOverlayOpen(false);
      setSidebarOpen(false);

      game.startWithPattern(opt.pattern);

      // Scroll after the DOM has a chance to paint.
      window.requestAnimationFrame(() => centerCanvasScroll());
    },
    [centerCanvasScroll, game, startOptions]
  );

  const onAdvancedStart = useCallback(() => {
    setStartOverlayOpen(false);
    setSidebarOpen(true);
  }, []);

  return (
    <div className="relative h-full min-h-0 p-4">
       {!sidebarOpen && !startOverlayOpen ? (

        <div className="absolute left-6 top-6 z-40">
          <Button
            className="h-10 w-10 rounded-full p-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Otvoriť menu"
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

      <div className={cn('flex h-full min-h-0', sidebarOpen ? 'gap-4' : 'gap-0')}>
        <div
          id="sidebar-drawer"
          className={cn(
            'relative z-30 h-full overflow-hidden transition-[width] duration-300 ease-out',
            sidebarOpen ? 'w-[92vw] max-w-[450px] md:w-[450px] md:max-w-none' : 'w-0 pointer-events-none'
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
            />
          </div>
        </div>

        <main className="h-full min-h-0 min-w-0 flex-1">
            <div className="relative h-full overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--canvas)] shadow-lg [--tw-shadow-color:var(--shadow-color)] [--tw-shadow:var(--tw-shadow-colored)]">
              <div className="pointer-events-none absolute bottom-4 left-4 z-10">
                <span className="inline-flex rounded-full border border-[var(--pill-border)] bg-[var(--field)] px-2 py-1 text-xs font-medium opacity-90">
                  {game.running ? 'Running' : 'Paused'}
                </span>
              </div>

              <div className="pointer-events-none absolute right-4 top-4 z-10 space-y-2">
               <div
                 className="w-[200px] overflow-hidden rounded-xl border border-[var(--panel-border)] px-3 py-2 text-xs font-medium"
                 style={{ backgroundColor: 'color-mix(in srgb, var(--panel) 88%, transparent)' }}
               >
                 <svg viewBox="0 0 120 34" width={120} height={34} className="block" aria-hidden="true">
                   <line x1={0} y1={mediumMidY} x2={120} y2={mediumMidY} stroke="var(--grid)" strokeWidth={1} opacity={0.35} />
                   {mediumNegSegments.map((points) => (
                     <polyline
                       key={`neg-${points}`}
                       points={points}
                       fill="none"
                       stroke="var(--wave-neg)"
                       strokeWidth={1.6}
                       strokeLinejoin="round"
                       strokeLinecap="round"
                       opacity={0.95}
                     />
                   ))}
                   {mediumPosSegments.map((points) => (
                     <polyline
                       key={`pos-${points}`}
                       points={points}
                       fill="none"
                       stroke="var(--wave-pos)"
                       strokeWidth={1.6}
                       strokeLinejoin="round"
                       strokeLinecap="round"
                       opacity={0.95}
                     />
                   ))}
                 </svg>
 
                 <div className="mt-1 flex items-center justify-between gap-2 tabular-nums opacity-90">
                   <div className="flex min-w-0 flex-1 items-center gap-1">
                     <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 opacity-80" aria-label="Generácia">
                       <title>Generácia</title>
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
                     <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 opacity-80" aria-label="Priemerná amplitúda média">
                       <title>Priemerná amplitúda média</title>
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
                 <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Počty buniek</div>

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
                     <span className="w-[52px] text-right" title="Živé bunky (hmota)">{formatCount(liveNow)}</span>
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
                     <span className="w-[52px] text-right" title="Živé antibunky (antihmota)">{formatCount(antiNow)}</span>
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
                  running={game.running}

                onPaintCell={game.paintCell}
                onNucleateCells={game.nucleateCells}
                onNucleateAntiCells={game.nucleateAntiCells}
                onMediumAvgAmplitude={onMediumAvgAmplitude}
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
