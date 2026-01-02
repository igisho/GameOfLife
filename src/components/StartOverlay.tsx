import Button from './ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { useI18n } from '../i18n/I18nProvider';
import type { Locale } from '../i18n/locales';
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

function PatternPreview({ pattern, variant = 'default' }: { pattern: string[]; variant?: 'default' | 'onPrimary' }) {
  const { width, height } = patternSize(pattern);

  const liveClass = variant === 'onPrimary' ? 'bg-[var(--on-primary)]' : 'bg-[var(--cell)]';
  const antiClass = 'bg-[var(--anti-cell)]';
  const offClass =
    variant === 'onPrimary' ? 'bg-[rgb(255_255_255_/_0.18)]' : 'bg-[color-mix(in srgb, var(--canvas) 70%, transparent)]';
  const borderClass =
    variant === 'onPrimary'
      ? 'border-[rgb(255_255_255_/_0.22)]'
      : 'border-[color-mix(in srgb, var(--grid) 55%, transparent)]';

  return (
    <div className="grid place-items-center" aria-hidden="true">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(1, width)}, minmax(0, 1fr))` }}>
        {Array.from({ length: width * height }, (_, idx) => {
          const r = Math.floor(idx / Math.max(1, width));
          const c = idx % Math.max(1, width);
          const row = pattern[r] ?? '';
          const cell = row[c];
          const isLive = cell === '#' || cell === 'O';
          const isAnti = cell === '@' || cell === 'A';
          const fillClass = isLive ? liveClass : isAnti ? antiClass : offClass;
          return (
            <div
              key={`${r}:${c}`}
              className={cn('h-3 w-3 rounded-[4px] border sm:h-4 sm:w-4 md:h-5 md:w-5', borderClass, fillClass)}
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
  const { locale, setLocale, t } = useI18n();

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="relative w-full max-w-[820px]">
        <div className="text-center">
          <div className="text-3xl font-semibold leading-tight sm:text-4xl">{t('start.title')}</div>
          <div className="mt-2 text-sm opacity-85">{t('start.subtitle')}</div>
        </div>

        <div className="mx-auto mt-6 grid w-full max-w-[560px] grid-cols-3 gap-2 sm:gap-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={cn(
                'start-breath group relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl',
                'cursor-pointer border border-[color-mix(in srgb, var(--primary) 85%, transparent)]',
                'bg-[var(--primary)] text-[var(--on-primary)] shadow-lg',
                'transition',
                'hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]',
                'active:translate-y-0 active:scale-[0.98]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-black/30'
              )}
              aria-label={t('start.ariaStartPattern', { name: opt.title })}
            >
              <div className="p-3 sm:p-4">
                <PatternPreview pattern={opt.pattern} variant="onPrimary" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center">
          <Button
            className={cn(
              'h-12 w-full max-w-[560px] rounded-2xl text-base font-semibold shadow-lg',
              'border border-[color-mix(in srgb, var(--panel-border) 92%, transparent)]',
              'bg-[color-mix(in srgb, var(--panel) 74%, transparent)]',
              'hover:-translate-y-0.5 hover:border-[var(--primary)] hover:bg-[color-mix(in srgb, var(--panel) 84%, transparent)]',
              'active:translate-y-0 active:scale-[0.99]'
            )}
            onClick={onAdvancedStart}
          >
            {t('start.advanced')}
          </Button>

          <div className="mt-4 w-full max-w-[560px]">
            <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{t('language.label')}</div>
            <div className="mt-1">
              <Select value={locale} onValueChange={(v) => setLocale(v as Locale, { replace: true })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t('common.choose')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('language.en')}</SelectItem>
                  <SelectItem value="de">{t('language.de')}</SelectItem>
                  <SelectItem value="fr">{t('language.fr')}</SelectItem>
                  <SelectItem value="sk">{t('language.sk')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <a
            className={cn(
              'mt-5 inline-flex w-full max-w-[560px] items-center justify-center gap-2 rounded-2xl border border-[var(--panel-border)]',
              'bg-[color-mix(in srgb, var(--panel) 74%, transparent)] px-4 py-3 text-sm font-medium opacity-90',
              'transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:bg-[color-mix(in srgb, var(--panel) 84%, transparent)]',
              'active:translate-y-0 active:scale-[0.99]'
            )}
            href="https://github.com/igisho/GameOfLife"
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
              <path
                fill="currentColor"
                d="M12 .5C5.65.5.5 5.8.5 12.32c0 5.22 3.29 9.65 7.86 11.22.58.11.79-.26.79-.57 0-.28-.01-1.03-.02-2.02-3.2.72-3.88-1.59-3.88-1.59-.52-1.37-1.27-1.73-1.27-1.73-1.04-.73.08-.72.08-.72 1.15.08 1.76 1.21 1.76 1.21 1.02 1.8 2.68 1.28 3.33.98.1-.76.4-1.28.72-1.57-2.55-.3-5.23-1.31-5.23-5.84 0-1.29.44-2.34 1.17-3.17-.12-.3-.51-1.51.11-3.15 0 0 .96-.32 3.14 1.21.91-.26 1.88-.39 2.85-.39.97 0 1.94.13 2.85.39 2.18-1.53 3.14-1.21 3.14-1.21.62 1.64.23 2.85.11 3.15.73.83 1.17 1.88 1.17 3.17 0 4.54-2.69 5.54-5.25 5.84.41.36.77 1.08.77 2.18 0 1.57-.01 2.84-.01 3.23 0 .31.21.68.8.57 4.56-1.58 7.85-6 7.85-11.22C23.5 5.8 18.35.5 12 .5z"
              />
            </svg>
            <span>{t('repo.link')}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
