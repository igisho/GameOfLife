import Button from './ui/Button';
import { cn } from '../lib/cn';

export type StartPatternOption = {
  id: string;
  title: string;
  pattern: string[];
  subtitle?: string;
};

function patternSize(pattern: string[]) {
  const height = pattern.length;
  let width = 0;
  for (const row of pattern) width = Math.max(width, row.length);
  return { width, height };
}

function PatternPreview({ pattern }: { pattern: string[] }) {
  const { width, height } = patternSize(pattern);

  return (
    <div className="grid place-items-center" aria-hidden="true">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(1, width)}, minmax(0, 1fr))` }}>
        {Array.from({ length: width * height }, (_, idx) => {
          const r = Math.floor(idx / Math.max(1, width));
          const c = idx % Math.max(1, width);
          const row = pattern[r] ?? '';
          const on = row[c] === '#';
          return (
            <div
              key={`${r}:${c}`}
              className={cn(
                'h-3 w-3 rounded-[4px] border border-[color-mix(in srgb, var(--grid) 55%, transparent)] sm:h-4 sm:w-4 md:h-5 md:w-5',
                on ? 'bg-[var(--cell)]' : 'bg-[color-mix(in srgb, var(--canvas) 70%, transparent)]'
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  options: StartPatternOption[];
  onSelect: (id: string) => void;
  onAdvancedStart: () => void;
};

export default function StartOverlay({ open, options, onSelect, onAdvancedStart }: Props) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="relative w-full max-w-[820px]">
        <div className="text-center">
          <div className="text-3xl font-semibold leading-tight sm:text-4xl">Začať život?</div>
        </div>

        <div className="mt-6 grid grid-cols-3 justify-items-center gap-3 sm:gap-4">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={cn(
                'start-breath group grid aspect-square w-full max-w-[140px] place-items-center overflow-hidden rounded-2xl',
                'border border-[color-mix(in srgb, var(--panel-border) 75%, transparent)]',
                'bg-[color-mix(in srgb, var(--canvas) 88%, transparent)] transition',
                'hover:scale-[1.03] hover:bg-[color-mix(in srgb, var(--canvas) 70%, var(--control))]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--primary)]'
              )}
              aria-label={`Začať: ${opt.title}`}
            >
              <div className="p-3 sm:p-4">
                <PatternPreview pattern={opt.pattern} />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col items-center gap-2">
          <Button className="h-10 w-full max-w-[320px]" onClick={onAdvancedStart}>
            advanced start
          </Button>
        </div>
      </div>
    </div>
  );
}
