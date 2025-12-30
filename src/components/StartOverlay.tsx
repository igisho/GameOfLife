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

function PatternPreview({ pattern, cellClassName }: { pattern: string[]; cellClassName?: string }) {
  const { width, height } = patternSize(pattern);

  return (
    <div
      className="grid place-items-center rounded-xl border border-[var(--panel-border)] bg-[var(--canvas)] p-3"
      aria-hidden="true"
    >
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, width)}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: width * height }, (_, idx) => {
          const r = Math.floor(idx / Math.max(1, width));
          const c = idx % Math.max(1, width);
          const row = pattern[r] ?? '';
          const on = row[c] === '#';
          return (
            <div
              key={`${r}:${c}`}
              className={cn(
                'h-4 w-4 rounded-[4px] border border-[color-mix(in srgb, var(--grid) 55%, transparent)]',
                on ? 'bg-[var(--cell)]' : 'bg-[color-mix(in srgb, var(--canvas) 70%, transparent)]',
                cellClassName
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
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="relative w-full max-w-[720px] rounded-2xl border border-[var(--panel-border)] bg-[color-mix(in srgb, var(--panel) 92%, transparent)] p-5 shadow-lg">
        <div className="text-center">
          <div className="text-lg font-semibold">Začať život?</div>
          <div className="mt-1 text-xs opacity-75">Vyber oscilátor a spusti simuláciu.</div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={cn(
                'group w-full overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--field)] p-3 text-left transition',
                'hover:bg-[color-mix(in srgb, var(--field) 70%, var(--control))]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--primary)]'
              )}
              aria-label={`Začať: ${opt.title}`}
            >
              <div className="text-sm font-semibold">{opt.title}</div>
              {opt.subtitle ? <div className="mt-0.5 text-xs opacity-70">{opt.subtitle}</div> : null}
              <div className="mt-3">
                <PatternPreview pattern={opt.pattern} />
              </div>
              <div
                className={cn(
                  'mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-[var(--primary)]',
                  'bg-[var(--primary)] text-sm font-medium text-[var(--on-primary)]',
                  'transition group-hover:bg-[var(--primary-hover)]'
                )}
                aria-hidden="true"
              >
                Štart
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <Button className="h-10 w-full max-w-[320px]" onClick={onAdvancedStart}>
            advanced start
          </Button>
          <div className="text-xs opacity-65">Otvorí menu bez automatického štartu.</div>
        </div>
      </div>
    </div>
  );
}
