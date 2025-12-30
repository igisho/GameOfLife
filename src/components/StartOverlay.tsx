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

  const onClass = variant === 'onPrimary' ? 'bg-[var(--on-primary)]' : 'bg-[var(--cell)]';
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
          const on = row[c] === '#';
          return (
            <div
              key={`${r}:${c}`}
              className={cn('h-3 w-3 rounded-[4px] border sm:h-4 sm:w-4 md:h-5 md:w-5', borderClass, on ? onClass : offClass)}
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
        </div>
      </div>
    </div>
  );
}
