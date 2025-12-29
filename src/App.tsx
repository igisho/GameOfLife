import { useEffect, useState } from 'react';
import LifeCanvas from './components/LifeCanvas';
import Sidebar from './components/Sidebar';
import Button from './components/ui/Button';
import { GOSPER_GUN, GLIDER, PULSAR } from './game/patterns';
import { useGameOfLife } from './game/useGameOfLife';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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
  }, [game]);

  return (
    <div className="relative h-full min-h-0 p-4">
      {!sidebarOpen ? (
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
              onPlaceGlider={() => game.centerPlace(GLIDER)}
              onPlacePulsar={() => game.centerPlace(PULSAR)}
              onPlaceGun={() => game.centerPlace(GOSPER_GUN)}
              onHide={() => setSidebarOpen(false)}
            />
          </div>
        </div>

        <main className="h-full min-h-0 min-w-0 flex-1">
          <div className="relative h-full overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--canvas)] shadow-lg shadow-black/20">
            <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
              <span className="inline-flex rounded-full border border-[var(--pill-border)] bg-[var(--field)] px-2 py-1 text-xs font-medium opacity-90">
                {`Generácia: ${game.generation}`}
              </span>
              <span className="inline-flex rounded-full border border-[var(--pill-border)] bg-[var(--field)] px-2 py-1 text-xs font-medium opacity-90">
                {`Živých: ${game.liveCount}`}
              </span>
            </div>

            <div className="h-full overflow-auto">
              <LifeCanvas
                settings={game.settings}
                liveRef={game.liveRef}
                generation={game.generation}
                drawNonce={game.drawNonce}
                theme={theme}
                onPaintCell={game.paintCell}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
