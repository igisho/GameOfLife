import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { createPortal } from 'react-dom';
import Button from './ui/Button';
import { cn } from '../lib/cn';
import Checkbox from './ui/Checkbox';
import ScrollArea from './ui/ScrollArea';
import Slider from './ui/Slider';
import Tooltip from './ui/Tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import type { ThemeName } from '../lib/themes';
import type { UseGameOfLifeResult } from '../game/useGameOfLife';

function SectionTitle({ children }: { children: string }) {
  return <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{children}</div>;
}

function HelpButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      className={
        "inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--pill-border)] bg-[var(--field)] text-[11px] font-semibold opacity-80 transition-opacity hover:opacity-100"
      }
      onClick={onToggle}
      aria-label={open ? t('helpButton.hide') : t('helpButton.show')}
      aria-expanded={open}
    >
      i
    </button>
  );
}

function HelpPanel({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={
        'grid transition-[grid-template-rows] duration-200 ease-out ' + (open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')
      }
    >
      <div className="overflow-hidden">
        <div className="pt-2">
          <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-2 text-xs leading-5 opacity-90">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpRow({
  label,
  help,
}: {
  label: ReactNode;
  help: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">{label}</div>
        <HelpButton open={open} onToggle={() => setOpen((v) => !v)} />
      </div>
      <HelpPanel open={open}>{help}</HelpPanel>
    </div>
  );
}

const CONTROL_ICON = 'h-5 w-5';

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

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
          const cell = row[c];

          const fillClass =
            cell === '#' || cell === 'O'
              ? 'bg-[var(--cell)]'
              : cell === '@' || cell === 'A'
                ? 'bg-[var(--anti-cell)]'
                : 'bg-[color-mix(in srgb, var(--canvas) 70%, transparent)]';

          return (
            <div
              key={`${r}:${c}`}
              className={cn(
                'h-3 w-3 rounded-[4px] border sm:h-4 sm:w-4',
                'border-[color-mix(in srgb, var(--grid) 55%, transparent)]',
                fillClass
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--field)] p-3">{children}</div>;
}

function LabeledSlider({
  label,
  help,
  value,
  min,
  max,
  step,
  onChange,
  dangerRanges,
}: {
  label: ReactNode;
  help?: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  dangerRanges?: Array<{ from: number; to: number }>;
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 text-xs font-medium opacity-90">
        <div className="min-w-0">{label}</div>
        {help ? <HelpButton open={helpOpen} onToggle={() => setHelpOpen((v) => !v)} /> : null}
      </div>
      {help ? <HelpPanel open={helpOpen}>{help}</HelpPanel> : null}
      <div className="mt-2">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          dangerRanges={dangerRanges}
          onValueChange={(v) => onChange(v[0] ?? value)}
        />
      </div>
    </Card>
  );
}



type QuickStartOption = {
  id: string;
  title: string;
  pattern: string[];
};

type Props = {
  game: UseGameOfLifeResult;
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  onHide: () => void;
  quickStartOptions: QuickStartOption[];
  onQuickStart: (id: string) => void;

  // Optional holographic preview actions.
  onHolographicCopyDebug?: () => void;
};

export default function Sidebar({
  game,
  theme,
  setTheme,
  onHide,
  quickStartOptions,
  onQuickStart,
  onHolographicCopyDebug,
}: Props) {
  void onHolographicCopyDebug;
  const { t } = useI18n();
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (!infoOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      // Capture so this runs before App-level shortcuts.
      const key = e.key.toLowerCase();

      if (e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setInfoOpen(false);
        return;
      }

      // Block simulation shortcuts while the modal is open.
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
  }, [infoOpen]);

  const densityPercent = useMemo(() => Math.round(game.settings.density * 100), [game.settings.density]);
  const lakeNoisePercent = useMemo(() => Math.round(game.settings.lakeNoiseIntensity * 100), [game.settings.lakeNoiseIntensity]);
  const annihilationBurstPercent = useMemo(
    () => Math.round(game.settings.annihilationBurst * 100),
    [game.settings.annihilationBurst]
  );
  const mediumMemoryRatePercent = useMemo(
    () => Math.round(game.settings.mediumMemoryRate * 100),
    [game.settings.mediumMemoryRate]
  );
  const mediumMemoryCoupling = useMemo(
    () => Math.round(game.settings.mediumMemoryCoupling * 10) / 10,
    [game.settings.mediumMemoryCoupling]
  );
  const mediumNonlinearity = useMemo(
    () => Math.round(game.settings.mediumNonlinearity * 10) / 10,
    [game.settings.mediumNonlinearity]
  );
  const mediumAmplitudeLimiter = useMemo(
    () => Math.round(game.settings.mediumAmplitudeLimiter * 10) / 10,
    [game.settings.mediumAmplitudeLimiter]
  );
  const hopHz = useMemo(() => Math.round(game.settings.hopHz * 10) / 10, [game.settings.hopHz]);
  const hopStrengthPercent = useMemo(
    () => Math.round(game.settings.hopStrength * 100),
    [game.settings.hopStrength]
  );
  const nucleationThreshold = useMemo(
    () => Math.round(game.settings.nucleationThreshold * 100) / 100,
    [game.settings.nucleationThreshold]
  );

  const dangerZoneNote = useMemo(() => t('slider.dangerZoneNote'), [t]);

  const mediumDangerZones = useMemo(() => {
    const threshold = clamp(nucleationThreshold, 0.05, 1);

    const hopHzRaw = clamp(game.settings.hopHz, 0, 20);
    const hopStrengthRaw = clamp(game.settings.hopStrength, 0, 3);
    const drive = hopHzRaw * hopStrengthRaw;

    // Heuristic: higher drive becomes less plausible sooner if the nucleation threshold is low.
    const driveDanger = 30 * clamp(threshold / 0.25, 0.4, 2);

    const hopHzDangerFrom =
      hopStrengthRaw > 1e-3 ? clamp(driveDanger / Math.max(0.05, hopStrengthRaw), 0, 20) : Number.POSITIVE_INFINITY;
    const hopStrengthDangerFromPercent =
      hopHzRaw > 1e-3 ? clamp((driveDanger / Math.max(0.1, hopHzRaw)) * 100, 0, 300) : Number.POSITIVE_INFINITY;

    const burst = clamp(game.settings.annihilationBurst, 0, 1);
    const density = clamp(game.settings.density, 0, 1);
    const burstDangerFromPercent = clamp(
      70 * clamp(threshold / 0.25, 0.5, 2) * clamp(1 - 0.6 * density, 0.35, 1),
      0,
      100
    );

    const memoryRate = clamp(game.settings.mediumMemoryRate, 0, 0.3);
    const memoryCouplingRaw = clamp(game.settings.mediumMemoryCoupling, 0, 60);

    // Heuristic: memory effects depend on (rate * coupling).
    const memoryEffectiveDanger = 4;
    const couplingDangerFrom =
      memoryRate > 1e-3 ? clamp(memoryEffectiveDanger / memoryRate, 0, 60) : Number.POSITIVE_INFINITY;
    const memoryRateDangerFromPercent =
      memoryCouplingRaw > 0.5 ? clamp((memoryEffectiveDanger / memoryCouplingRaw) * 100, 0, 30) : Number.POSITIVE_INFINITY;

    const noise = clamp(game.settings.lakeNoiseIntensity, 0, 1);
    const noiseDangerFromPercent = clamp(50 * (threshold / 0.25), 10, 100);

    // Heuristic: strong excitation makes a very low threshold physically implausible (constant nucleation).
    const minThresholdSafe = clamp(0.1 + 0.0025 * drive + 0.1 * burst + 0.05 * noise, 0.05, 1);

    const excitation = drive + burst * (0.5 + 3 * density) * 12 + noise * 10;
    const nonlinearityDangerFrom = clamp(55 - excitation * 0.7, 10, 60);

    const toRanges = (from: number, min: number, max: number) => {
      if (!Number.isFinite(from) || from >= max) return [] as Array<{ from: number; to: number }>;
      return [{ from: clamp(from, min, max), to: max }];
    };

    const between = (from: number, to: number, min: number, max: number) => {
      if (!Number.isFinite(from) || !Number.isFinite(to)) return [] as Array<{ from: number; to: number }>;
      const a = clamp(from, min, max);
      const b = clamp(to, min, max);
      if (Math.abs(a - b) < 1e-6) return [] as Array<{ from: number; to: number }>;
      return [{ from: a, to: b }];
    };

    return {
      hopHz: toRanges(hopHzDangerFrom, 0, 20),
      hopStrength: toRanges(hopStrengthDangerFromPercent, 0, 300),
      annihilationBurst: toRanges(burstDangerFromPercent, 0, 100),
      memoryRate: toRanges(memoryRateDangerFromPercent, 0, 30),
      memoryCoupling: toRanges(couplingDangerFrom, 0, 60),
      nonlinearity: toRanges(nonlinearityDangerFrom, 0, 60),
      lakeNoise: toRanges(noiseDangerFromPercent, 0, 100),
      nucleationThreshold: between(0.05, minThresholdSafe, 0.05, 1),
    };
  }, [game.settings, nucleationThreshold]);

  const holographicDangerZones = useMemo(() => {
    const toRanges = (from: number, min: number, max: number) => {
      if (!Number.isFinite(from) || from >= max) return [] as Array<{ from: number; to: number }>;
      return [{ from: clamp(from, min, max), to: max }];
    };

    // Heuristic: warn when cost gets high.
    const stepsDangerFrom = 24;
    const gridNDangerFrom = 8;
    return {
      steps: toRanges(stepsDangerFrom, 6, 32),
      gridN: toRanges(gridNDangerFrom, 4, 16),
    };
  }, []);
  const mediumStepsPerGeneration = useMemo(
    () => Math.round(game.settings.mediumStepsPerGeneration),
    [game.settings.mediumStepsPerGeneration]
  );

  const infoModal = infoOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('info.modal.ariaLabel')}
        >
          <div className="absolute inset-0 bg-black/60" onMouseDown={() => setInfoOpen(false)} aria-hidden="true" />

          <div
            className="relative flex w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] shadow-lg h-[calc(100svh-2rem)] sm:h-[80vh]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--panel-border)] p-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{t('info.modal.title')}</div>
                <div className="mt-0.5 text-xs opacity-70">{t('info.modal.subtitle')}</div>
              </div>
              <Button className="h-9 w-9 rounded-full p-0" onClick={() => setInfoOpen(false)} aria-label={t('common.close')}>
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </Button>
            </div>

            <ScrollArea className="flex-1 min-h-0 touch-pan-y overscroll-contain">
              <div className="space-y-4 p-4 text-sm leading-6">
                <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--field)] p-3 text-xs opacity-90">
                  {t('info.intro')}
                </div>

                <div className="space-y-2">
                  <SectionTitle>{t('info.postulate.title')}</SectionTitle>
                  <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--field)] p-3">
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      <li>{t('info.postulate.0')}</li>
                      <li>{t('info.postulate.1')}</li>
                      <li>{t('info.postulate.2')}</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <SectionTitle>{t('info.timeSpace.title')}</SectionTitle>
                  <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--field)] p-3">
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      <li>{t('info.timeSpace.0')}</li>
                      <li>{t('info.timeSpace.1')}</li>
                      <li>
                        {t('info.timeSpace.2a')} <span className="font-semibold">{t('info.timeSpace.2b')}</span>
                        {t('info.timeSpace.2c')}
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <SectionTitle>{t('info.antimatter.title')}</SectionTitle>
                  <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--field)] p-3">
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      <li>{t('info.antimatter.0')}</li>
                      <li>{t('info.antimatter.1')}</li>
                      <li>{t('info.antimatter.2')}</li>
                    </ul>
                  </div>
                </div>

                 <div className="space-y-2">
                   <SectionTitle>{t('info.simNote.title')}</SectionTitle>
                   <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--field)] p-3">
                     <ul className="list-disc space-y-1 pl-5 text-sm">
                       <li>{t('info.simNote.0')}</li>
                       <li>{t('info.simNote.1')}</li>
                     </ul>
                   </div>
                 </div>

                 <div className="space-y-2">
                   <SectionTitle>{t('info.modelMath.title')}</SectionTitle>
                   <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--field)] p-3">
                     <div className="text-xs opacity-80">{t('info.modelMath.subtitle')}</div>

                     <details className="mt-3">
                       <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide opacity-80">
                         {t('info.modelMath.open')}
                       </summary>

                       <div className="mt-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-3">
                         <div className="mb-2 text-xs opacity-80">{t('info.modelMath.warning')}</div>
                         <pre className="max-w-full overflow-x-auto whitespace-pre text-[11px] leading-5 tabular-nums">
{(() => {
  const s = game.settings;

  const fmt = (n: number, digits = 4) => {
    if (!Number.isFinite(n)) return 'NaN';
    const v = Number(n.toFixed(digits));
    return String(v);
  };

  const fmtBool = (v: boolean) => (v ? 'true' : 'false');
  const fmtMode = (v: string) => v;

  const waveW = clamp(Math.floor(s.cols / 4), 160, 512);
  const waveH = clamp(Math.floor(s.rows / 4), 160, 512);

  const mediumSteps = clamp(Math.round(s.mediumStepsPerGeneration), 1, 12);
  const fixedDtPerGeneration = 1 / 60;
  const hStep = fixedDtPerGeneration / mediumSteps;

  const hopHz = clamp(s.hopHz, 0, 20);
  const hopStrength = clamp(s.hopStrength, 0, 3);
  const hopKick = 0.16 * hopStrength;

  const memoryRate = clamp(s.mediumMemoryRate, 0, 0.3);
  const memoryCoupling = clamp(s.mediumMemoryCoupling, 0, 60);
  const nonlinearity = clamp(s.mediumNonlinearity, 0, 60);

  const annihilationBurst = clamp(s.annihilationBurst, 0, 1);
  const neighborShare = annihilationBurst * 0.25;

  const nucleationThreshold = clamp(s.nucleationThreshold, 0.01, 2);

  const ampLimit = clamp(s.mediumAmplitudeLimiter, 0, 50);

  const c2 = 36;
  const gamma = 2.2;
  const kappa = 2.0;

  const dt2 = hStep * hStep;
  const gFactor = gamma * hStep * 0.5;
  const denom = 1 + gFactor;

  const lines: string[] = [];

  lines.push(`## ${t('info.modelMath.block.params')}`);
  lines.push(`grid: rows=${s.rows} cols=${s.cols} wrap=${fmtBool(s.wrap)}`);
  lines.push(`conway rule: B3/S23 (Moore 8-neighborhood)`);
  lines.push(`antiparticlesEnabled=${fmtBool(s.antiparticlesEnabled)} (same Conway rule)`);
  lines.push('');

  lines.push(`wave grid (downsample): w=clamp(floor(cols/4),160,512)=${waveW}  h=clamp(floor(rows/4),160,512)=${waveH}`);
  lines.push('');

  lines.push(`mediumMode=${fmtMode(s.mediumMode)}`);
  lines.push(`medium dt per Conway generation: fixedDtPerGeneration = 1/60`);
  lines.push(`mediumStepsPerGeneration: requested=${fmt(s.mediumStepsPerGeneration, 2)} -> substeps=clamp(round(.),1,12)=${mediumSteps}`);
  lines.push(`hStep = (1/60)/substeps = ${fmt(hStep, 6)}`);
  lines.push('');

  lines.push(`hopHz=clamp(${fmt(s.hopHz, 3)},0,20)=${fmt(hopHz, 3)}  hopStrength=clamp(${fmt(s.hopStrength, 3)},0,3)=${fmt(hopStrength, 3)}`);
  lines.push(`hopKick = 0.16*hopStrength = ${fmt(hopKick, 6)}`);
  lines.push('');

  lines.push(`annihilationBurst=clamp(${fmt(s.annihilationBurst, 3)},0,1)=${fmt(annihilationBurst, 3)}`);
  lines.push(`neighborShare = annihilationBurst*0.25 = ${fmt(neighborShare, 6)}`);
  lines.push('');

  lines.push(`memoryRate=clamp(${fmt(s.mediumMemoryRate, 4)},0,0.3)=${fmt(memoryRate, 4)}`);
  lines.push(`memoryCoupling=clamp(${fmt(s.mediumMemoryCoupling, 3)},0,60)=${fmt(memoryCoupling, 3)}`);
  lines.push(`nonlinearity=clamp(${fmt(s.mediumNonlinearity, 3)},0,60)=${fmt(nonlinearity, 3)}`);
  lines.push('');

  lines.push(`nucleationThreshold=clamp(${fmt(s.nucleationThreshold, 4)},0.01,2)=${fmt(nucleationThreshold, 4)}`);
  lines.push(`lakeNoiseEnabled=${fmtBool(s.lakeNoiseEnabled)} intensity=${fmt(s.lakeNoiseIntensity, 4)} blobSize=${fmt(s.lakeBlobSize, 2)} blobShape=${s.lakeBlobShape}`);
  lines.push('');

  lines.push(`mediumAmplitudeLimiter (numerical): clamp(${fmt(s.mediumAmplitudeLimiter, 3)},0,50)=${fmt(ampLimit, 3)} (0 = off)`);
  lines.push('');

  lines.push(`constants: c2=${c2} gamma=${gamma} kappa=${kappa}`);
  lines.push(`dt2=hStep^2=${fmt(dt2, 8)}  gFactor=gamma*hStep*0.5=${fmt(gFactor, 8)}  denom=(1+gFactor)=${fmt(denom, 8)}`);
  lines.push('');

  lines.push(`## ${t('info.modelMath.block.conway')}`);
  lines.push('For each set current ∈ {live, anti}:');
  lines.push('  counts := empty map cellKey -> int');
  lines.push('  for each alive cell (r,c) in current:');
  lines.push('    for dr in {-1,0,1}, dc in {-1,0,1}, not (dr=0 and dc=0):');
  lines.push('      neighbor (rr,cc):');
  lines.push('        if wrap: rr=(rr+rows)%rows, cc=(cc+cols)%cols');
  lines.push('        else: skip if rr<0 or rr>=rows or cc<0 or cc>=cols');
  lines.push('      counts[key(rr,cc)]++');
  lines.push('');
  lines.push('  next := empty set');
  lines.push('  for each (cellKey k, neighborCount n) in counts:');
  lines.push('    alive := (k in current)');
  lines.push('    if alive: keep iff n==2 or n==3');
  lines.push('    if dead:  birth iff n==3');
  lines.push('');
  lines.push('After both sets update:');
  lines.push('  annihilateOverlap(nextLive, nextAnti): remove any cellKey present in both');
  lines.push('  (removed keys are recorded as annihilation events for medium impulses)');
  lines.push('');

  lines.push(`## ${t('info.modelMath.block.medium')}`);
  lines.push('If mediumMode == off: medium state reset to 0 each frame.');
  lines.push('Else, per Conway generation:');
  lines.push('  fixedDtPerGeneration = 1/60');
  lines.push('  substeps = clamp(round(mediumStepsPerGeneration), 1, 12)');
  lines.push('  hStep = fixedDtPerGeneration / substeps');
  lines.push('');
  lines.push('  source map rebuild (downsample from Conway grid):');
  lines.push('    source[p] -= 1 for each live cell mapped to wave pixel p');
  lines.push('    source[p] += 1 for each anti cell mapped to wave pixel p (if antiparticlesEnabled)');
  lines.push('    normalize by inv = 1 / ((cols/waveW) * (rows/waveH))');
  lines.push('');
  lines.push('  apply annihilation impulses (for each annihilation event key):');
  lines.push('    map Conway (r,c) -> wave (x=floor((c/cols)*waveW), y=floor((r/rows)*waveH))');
  lines.push(`    uCurr[x,y] += burst (${fmt(annihilationBurst, 4)})`);
  lines.push(`    uPrev[x,y] -= burst (${fmt(annihilationBurst, 4)})`);
  lines.push(`    4-neighbors get -neighborShare (${fmt(neighborShare, 6)}) similarly`);
  lines.push('');

  lines.push('  for sub=1..substeps do stepMediumOnce:');
  lines.push('    (1) hopping drive:');
  lines.push('      phase += 2π*hopHz*hStep');
  lines.push('      impacts = floor(phase / 2π)');
  lines.push('      phase = phase mod 2π');
  lines.push('      for each wave cell i with source[i] != 0:');
  lines.push('        kick = (0.16*hopStrength*impacts) * source[i]');
  lines.push('        uCurr[i] += kick;  uPrev[i] -= kick');
  lines.push('');
  lines.push('    (2) ambient noise (if enabled): random blobs added to uCurr');
  lines.push('');
  lines.push('    (3) optional numerical limiter (if mediumAmplitudeLimiter>0):');
  lines.push('        u := L*tanh(u/L) applied to uCurr and uPrev');
  lines.push('');
  lines.push('    (4) memory update (if memoryRate>0):');
  lines.push('        m := (1-r)*m + r*uCurr');
  lines.push('');
  lines.push('    (5) laplacians (4-neighbor, wrap or edge-clamp):');
  lines.push('        lap1 := L(uCurr)');
  lines.push('        lap2 := L(lap1)');
  lines.push('        L(u)[i] = left+right+up+down - 4*u[i]');
  lines.push('');
  lines.push('    (6) integrate (per wave cell i):');
  lines.push('        nonlinearTerm = -nonlinearity * u^3');
  lines.push('        memoryTerm    =  memoryCoupling * m');
  lines.push('        rhs = c2*lap1 - kappa*lap2 + nonlinearTerm + memoryTerm');
  lines.push('        uNext = (2*u - uPrev*(1-gFactor) + dt2*rhs) / (1+gFactor)');
  lines.push('        (with dt2=hStep^2 and gFactor=gamma*hStep*0.5)');
  lines.push('');

  lines.push(`## ${t('info.modelMath.block.nucleation')}`);
  lines.push('If mediumMode == nucleation:');
  lines.push('  threshold = clamp(nucleationThreshold, 0.01, 2)');
  lines.push('  blur twice with 3×3 box blur: driveA := blur(blur(uCurr))');
  lines.push('  scan order is deterministic: start=scanOffset; scanOffset=(start+9973)%len');
  lines.push('  for each wave cell i in scan order (skip visited/cooldown):');
  lines.push('    if driveA[i] > threshold => positive nucleus candidate');
  lines.push('    if driveA[i] < -threshold => negative candidate (requires antiparticlesEnabled)');
  lines.push('    flood fill 4-neighbor component above threshold (or below -threshold)');
  lines.push('    pick peak within component; set cooldownFrames=round(0.6*60)=36');
  lines.push('    radiusCells = clamp(round(sqrt((|peak|-threshold)/threshold)*4), 0, 8)');
  lines.push('    map peak wave cell -> Conway grid center (rows/cols)');
  lines.push('    emit 2×2 block if radiusCells<=1 else disk of radiusCells');
  lines.push('');

  return lines.join('\n');
})()}
                         </pre>
                       </div>
                     </details>
                   </div>
                 </div>
               </div>
             </ScrollArea>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {infoModal}
       <aside className="h-full min-h-0 min-w-0 w-screen max-w-[100vw] overflow-x-visible overflow-y-hidden rounded-none border border-[var(--panel-border)] bg-[var(--panel)] shadow-lg [--tw-shadow-color:var(--shadow-color)] [--tw-shadow:var(--tw-shadow-colored)] md:min-w-[450px] md:w-full md:max-w-none md:rounded-2xl">
        <ScrollArea className="h-full w-full">
          <div className="w-screen max-w-[100vw] min-w-0 space-y-4 p-4 md:w-full">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-6">{t('sidebar.title')}</h1>
              <p className="mt-0.5 text-xs opacity-70">{t('sidebar.subtitle')}</p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <Tooltip label={t('sidebar.info.tooltip')}>
                <Button
                  className="h-9 w-9 rounded-full p-0"
                  onClick={() => setInfoOpen(true)}
                  aria-label={t('sidebar.info.button')}
                  aria-haspopup="dialog"
                  aria-expanded={infoOpen}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path d="M12 10v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 7.25h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </Button>
              </Tooltip>

              <Button className="h-9 w-9 rounded-full p-0" onClick={onHide} aria-label={t('app.closeMenu')}>
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M6 6L18 18M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <SectionTitle>{t('controls.title')}</SectionTitle>
            <div className="flex items-center justify-center gap-2">
              <Tooltip label={t('controls.prev.tooltip')}>
                <Button
                  className="h-10 w-10 rounded-full p-0"
                  onClick={() => game.stepPrev()}
                  disabled={game.running || game.undoCount === 0}
                  aria-label={t('controls.prev.aria')}
                >
                  <svg viewBox="0 0 24 24" fill="none" className={CONTROL_ICON} aria-hidden="true">
                    <path d="M7 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M19 6L9 12l10 6V6z" fill="currentColor" />
                  </svg>
                </Button>
              </Tooltip>

              <Tooltip label={game.running ? t('app.pause') : t('app.play')}>
                <Button
                  variant="primary"
                  className="h-10 w-10 rounded-full p-0"
                  onClick={() => game.toggleRunning()}
                  aria-label={game.running ? t('app.pause') : t('app.play')}
                >
                  {game.running ? (
                    <svg viewBox="0 0 24 24" fill="none" className={CONTROL_ICON} aria-hidden="true">
                      <path d="M7 6h3v12H7V6zm7 0h3v12h-3V6z" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className={CONTROL_ICON} aria-hidden="true">
                      <path d="M8 5v14l12-7L8 5z" fill="currentColor" />
                    </svg>
                  )}
                </Button>
              </Tooltip>

              <Tooltip label={t('controls.next.tooltip')}>
                <Button
                  className="h-10 w-10 rounded-full p-0"
                  onClick={() => game.stepOnce()}
                  disabled={game.running}
                  aria-label={t('controls.next.aria')}
                >
                  <svg viewBox="0 0 24 24" fill="none" className={CONTROL_ICON} aria-hidden="true">
                    <path d="M17 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M5 6l10 6-10 6V6z" fill="currentColor" />
                  </svg>
                </Button>
              </Tooltip>

              <Tooltip label={t('controls.random.tooltip')}>
                <Button
                  className="h-10 w-10 rounded-full p-0"
                  onClick={() => game.randomize()}
                  aria-label={t('controls.random.aria')}
                >
                  <svg viewBox="0 0 24 24" fill="none" className={CONTROL_ICON} aria-hidden="true">
                    <path
                      d="M4 7h4l8 10h4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M20 7l-2-2m2 2l-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M20 17l-2-2m2 2l-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path
                      d="M4 17h4l2.5-3.1"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10.5 10.1L8 7H4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Button>
              </Tooltip>

              <Tooltip label={t('controls.stop.tooltip')}>
                <Button
                  variant="danger"
                  className="h-10 w-10 rounded-full p-0"
                  onClick={() => game.clearAll()}
                  aria-label={t('controls.stop.aria')}
                >
                  <svg viewBox="0 0 24 24" fill="none" className={CONTROL_ICON} aria-hidden="true">
                    <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
                  </svg>
                </Button>
              </Tooltip>
            </div>
          </div>

          <div className="space-y-2">
            <SectionTitle>{t('sidebar.quickStart.title')}</SectionTitle>
            <div className="mx-auto grid w-full max-w-[360px] grid-cols-3 gap-2">
              {quickStartOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onQuickStart(opt.id)}
                  className={cn(
                    'group relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl',
                    'cursor-pointer border border-[var(--panel-border)]',
                    'bg-[var(--field)] text-[var(--text)] shadow-sm transition',
                    'hover:-translate-y-0.5 hover:border-[var(--primary)]',
                    'active:translate-y-0 active:scale-[0.98]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--panel)]'
                  )}
                  aria-label={t('start.ariaStartPattern', { name: opt.title })}
                >
                  <div className="p-3">
                    <PatternPreview pattern={opt.pattern} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <SectionTitle>{t('simulation.title')}</SectionTitle>
            <LabeledSlider
              label={t('simulation.speed', { value: game.settings.speedMs })}
              help={t('simulation.speedHelp')}
              value={game.settings.speedMs}
              min={10}
              max={400}
              step={1}
              onChange={(v) => game.setSpeedMs(v)}
            />
            <LabeledSlider
              label={t('simulation.density', { value: densityPercent })}
              help={t('simulation.densityHelp')}
              value={densityPercent}
              min={0}
              max={100}
              step={1}
              onChange={(v) => game.setDensityPercent(v)}
            />
          </div>

          <div className="space-y-2">
            <SectionTitle>{t('medium.title')}</SectionTitle>
            <Card>
              <HelpRow
                label={<div className="text-xs font-medium opacity-90">{t('medium.mode.label')}</div>}
                help={t('medium.mode.help')}
              />
              <div className="mt-2">
                <Select value={game.settings.mediumMode} onValueChange={(v) => game.setMediumMode(v as typeof game.settings.mediumMode)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('medium.mode.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">{t('medium.mode.off')}</SelectItem>
                    <SelectItem value="nucleation">{t('medium.mode.nucleation')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               <div className="mt-3">
                <HelpRow
                  label={
                     <div className="text-xs font-medium opacity-90">{t('medium.hopHz.label', { value: hopHz })}</div>
                   }
                    help={
                      <>
                        {t('medium.hopHz.help')}
                        <div className="mt-1 opacity-80">{dangerZoneNote}</div>
                      </>
                    }

                />
                 <div className="mt-2">
                   <Slider
                     value={[hopHz]}
                     min={0}
                     max={20}
                     step={0.1}
                     dangerRanges={mediumDangerZones.hopHz}
                     onValueChange={(v) => game.setHopHz(v[0] ?? hopHz)}
                   />
                 </div>

              </div>

               <div className="mt-3">
                <HelpRow
                  label={
                     <div className="text-xs font-medium opacity-90">
                       {t('medium.hopStrength.label', { value: hopStrengthPercent })}
                     </div>
                   }
                    help={
                      <>
                        {t('medium.hopStrength.help')}
                        <div className="mt-1 opacity-80">{dangerZoneNote}</div>
                      </>
                    }

                />
                <div className="mt-2">
                   <Slider
                     value={[hopStrengthPercent]}
                     min={0}
                     max={300}
                     step={1}
                     dangerRanges={mediumDangerZones.hopStrength}
                     onValueChange={(v) => game.setHopStrength((v[0] ?? hopStrengthPercent) / 100)}
                   />

                </div>
               </div>

               <div className="mt-3">
                 <HelpRow
                   label={<div className="text-xs font-medium opacity-90">{t('medium.stepsPerGeneration.label', { value: mediumStepsPerGeneration })}</div>}
                   help={t('medium.stepsPerGeneration.help')}
                 />
                 <div className="mt-2">
                   <Slider
                     value={[mediumStepsPerGeneration]}
                     min={1}
                     max={12}
                     step={1}
                     onValueChange={(v) => game.setMediumStepsPerGeneration(v[0] ?? mediumStepsPerGeneration)}
                   />
                 </div>
               </div>
 
               {game.settings.mediumMode === 'nucleation' ? (
                 <div className="mt-3">
                   <HelpRow
                    label={
                         <div className="text-xs font-medium opacity-90">
                           {t('medium.nucleationThreshold.label', { value: nucleationThreshold })}
                         </div>
                       }
                        help={
                          <>
                            {t('medium.nucleationThreshold.help')}
                            <div className="mt-1 opacity-80">{dangerZoneNote}</div>
                          </>
                        }

                  />
                  <div className="mt-2">
                     <Slider
                       value={[nucleationThreshold]}
                       min={0.05}
                       max={1}
                       step={0.01}
                       dangerRanges={mediumDangerZones.nucleationThreshold}
                       onValueChange={(v) => game.setNucleationThreshold(v[0] ?? nucleationThreshold)}
                     />

                  </div>
                </div>
              ) : null}

               <div className="mt-3">
                 <HelpRow
                   label={
                     <label className="flex items-center gap-2 text-sm">
                       <Checkbox
                         checked={game.settings.antiparticlesEnabled}
                         onCheckedChange={(v) => game.setAntiparticlesEnabled(Boolean(v))}
                       />
                        <span>{t('medium.antiparticles.label')}</span>
                     </label>
                   }
                    help={t('medium.antiparticles.help')}
                 />
               </div>

                 <div className="mt-4 border-t border-[var(--panel-border)] pt-3">
                   <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{t('medium.tuning.title')}</div>

                  <div className="mt-3">
                    <HelpRow
                      label={
                         <div className="text-xs font-medium opacity-90">
                           {t('medium.annihilationEnergy.label', { value: annihilationBurstPercent })}
                         </div>
                       }
                        help={
                          <>
                            {t('medium.annihilationEnergy.help')}
                            <div className="mt-1 opacity-80">{dangerZoneNote}</div>
                          </>
                        }

                    />
                   <div className="mt-2">
                      <Slider
                        value={[annihilationBurstPercent]}
                        min={0}
                        max={100}
                        step={1}
                        dangerRanges={mediumDangerZones.annihilationBurst}
                        onValueChange={(v) => game.setAnnihilationBurstPercent(v[0] ?? annihilationBurstPercent)}
                      />

                   </div>
                 </div>

                  <div className="mt-3">
                    <HelpRow
                      label={
                         <div className="text-xs font-medium opacity-90">
                           {t('medium.memoryRate.label', { value: mediumMemoryRatePercent })}
                         </div>
                       }
                        help={
                          <>
                            {t('medium.memoryRate.help')}
                            <div className="mt-1 opacity-80">{dangerZoneNote}</div>
                          </>
                        }

                    />
                   <div className="mt-2">
                      <Slider
                        value={[mediumMemoryRatePercent]}
                        min={0}
                        max={30}
                        step={1}
                        dangerRanges={mediumDangerZones.memoryRate}
                        onValueChange={(v) => game.setMediumMemoryRatePercent(v[0] ?? mediumMemoryRatePercent)}
                      />

                   </div>
                 </div>

                  <div className="mt-3">
                    <HelpRow
                      label={
                         <div className="text-xs font-medium opacity-90">
                           {t('medium.memoryCoupling.label', { value: mediumMemoryCoupling })}
                         </div>
                       }
                        help={
                          <>
                            {t('medium.memoryCoupling.help')}
                            <div className="mt-1 opacity-80">{dangerZoneNote}</div>
                          </>
                        }

                    />
                   <div className="mt-2">
                      <Slider
                        value={[mediumMemoryCoupling]}
                        min={0}
                        max={60}
                        step={0.5}
                        dangerRanges={mediumDangerZones.memoryCoupling}
                        onValueChange={(v) => game.setMediumMemoryCoupling(v[0] ?? mediumMemoryCoupling)}
                      />

                   </div>
                 </div>

                   <div className="mt-3">
                     <HelpRow
                       label={
                          <div className="text-xs font-medium opacity-90">
                            {t('medium.nonlinearity.label', { value: mediumNonlinearity })}
                          </div>
                        }
                         help={
                           <>
                             {t('medium.nonlinearity.help')}
                             <div className="mt-1 opacity-80">{dangerZoneNote}</div>
                           </>
                         }
 
                     />
                    <div className="mt-2">
                       <Slider
                         value={[mediumNonlinearity]}
                         min={0}
                         max={60}
                         step={0.5}
                         dangerRanges={mediumDangerZones.nonlinearity}
                         onValueChange={(v) => game.setMediumNonlinearity(v[0] ?? mediumNonlinearity)}
                       />
 
                    </div>
                  </div>

                  <div className="mt-3">
                    <HelpRow
                      label={
                        <div className="text-xs font-medium opacity-90">
                          {t('medium.amplitudeLimiter.label', {
                            value: mediumAmplitudeLimiter > 0 ? mediumAmplitudeLimiter : t('common.off'),
                          })}
                        </div>
                      }
                      help={t('medium.amplitudeLimiter.help')}
                    />
                    <div className="mt-2">
                      <Slider
                        value={[mediumAmplitudeLimiter]}
                        min={0}
                        max={50}
                        step={0.5}
                        onValueChange={(v) => game.setMediumAmplitudeLimiter(v[0] ?? mediumAmplitudeLimiter)}
                      />
                    </div>
                  </div>
                </div>
             </Card>
          </div>



          <div className="space-y-2">
            <SectionTitle>{t('holographic.sidebar.title')}</SectionTitle>
            <Card>
              <div className="rounded-xl border border-[var(--danger-border)] bg-[color-mix(in srgb, var(--danger) 10%, var(--panel))] px-3 py-2 text-xs">
                <span className="font-semibold">{t('holographic.computeHeavy.title')}</span>
                <span className="opacity-80"> {t('holographic.computeHeavy.body')}</span>
              </div>

              <div className="mt-3">
                <HelpRow
                  label={<div className="text-xs font-medium opacity-90">{t('holographic.view.label')}</div>}
                  help={t('holographic.view.help')}
                />
                <div className="mt-2">
                  <Select
                    value={String(game.settings.holographicViewMode)}
                    onValueChange={(v) => game.setHolographicViewMode(clamp(Number(v), 0, 4) as 0 | 1 | 2 | 3 | 4)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.choose')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t('holographic.view.hologram')}</SelectItem>
                      <SelectItem value="1">{t('holographic.view.sources')}</SelectItem>
                      <SelectItem value="2">{t('holographic.view.field')}</SelectItem>
                      <SelectItem value="3">{t('holographic.view.delta')}</SelectItem>
                      <SelectItem value="4">{t('holographic.view.accum')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-3">
                <HelpRow
                  label={<div className="text-xs font-medium opacity-90">{t('holographic.tuning.steps.label', { value: game.settings.holographicSteps })}</div>}
                  help={t('holographic.tuning.steps.help')}
                />
                <div className="mt-2">
                  <Slider
                    value={[game.settings.holographicSteps]}
                    min={6}
                    max={32}
                    step={1}
                    dangerRanges={holographicDangerZones.steps}
                    onValueChange={(v) => game.setHolographicSteps(v[0] ?? game.settings.holographicSteps)}
                  />
                </div>
              </div>

              <div className="mt-3">
                <HelpRow
                  label={<div className="text-xs font-medium opacity-90">{t('holographic.tuning.gridN.label', { value: game.settings.holographicGridN })}</div>}
                  help={t('holographic.tuning.gridN.help')}
                />
                <div className="mt-2">
                  <Slider
                    value={[game.settings.holographicGridN]}
                    min={4}
                    max={16}
                    step={1}
                    dangerRanges={holographicDangerZones.gridN}
                    onValueChange={(v) => game.setHolographicGridN(v[0] ?? game.settings.holographicGridN)}
                  />
                </div>
              </div>

              <div className="mt-4 border-t border-[var(--panel-border)] pt-3">
                <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{t('holographic.tuning.title')}</div>

                <div className="mt-3">
                  <HelpRow
                    label={<div className="text-xs font-medium opacity-90">{t('holographic.tuning.exposure.label', { value: game.settings.holographicExposureBoost })}</div>}
                    help={t('holographic.tuning.exposure.help')}
                  />
                  <div className="mt-2">
                    <Slider
                      value={[game.settings.holographicExposureBoost]}
                      min={0.25}
                      max={6}
                      step={0.05}
                      onValueChange={(v) => game.setHolographicExposureBoost(v[0] ?? game.settings.holographicExposureBoost)}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <HelpRow
                    label={<div className="text-xs font-medium opacity-90">{t('holographic.tuning.threshold.label', { value: game.settings.holographicThr })}</div>}
                    help={t('holographic.tuning.threshold.help')}
                  />
                  <div className="mt-2">
                    <Slider
                      value={[game.settings.holographicThr]}
                      min={0.0}
                      max={0.2}
                      step={0.001}
                      onValueChange={(v) => game.setHolographicThr(v[0] ?? game.settings.holographicThr)}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <HelpRow
                    label={<div className="text-xs font-medium opacity-90">{t('holographic.tuning.gamma.label', { value: game.settings.holographicGamma })}</div>}
                    help={t('holographic.tuning.gamma.help')}
                  />
                  <div className="mt-2">
                    <Slider
                      value={[game.settings.holographicGamma]}
                      min={0.8}
                      max={3.2}
                      step={0.05}
                      onValueChange={(v) => game.setHolographicGamma(v[0] ?? game.settings.holographicGamma)}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <HelpRow
                    label={<div className="text-xs font-medium opacity-90">{t('holographic.tuning.k.label', { value: game.settings.holographicK })}</div>}
                    help={t('holographic.tuning.k.help')}
                  />
                  <div className="mt-2">
                    <Slider
                      value={[game.settings.holographicK]}
                      min={4}
                      max={28}
                      step={0.25}
                      onValueChange={(v) => game.setHolographicK(v[0] ?? game.settings.holographicK)}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <HelpRow
                    label={<div className="text-xs font-medium opacity-90">{t('holographic.tuning.phaseGain.label', { value: game.settings.holographicPhaseGain })}</div>}
                    help={t('holographic.tuning.phaseGain.help')}
                  />
                  <div className="mt-2">
                    <Slider
                      value={[game.settings.holographicPhaseGain]}
                      min={0}
                      max={16}
                      step={0.1}
                      onValueChange={(v) => game.setHolographicPhaseGain(v[0] ?? game.settings.holographicPhaseGain)}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <HelpRow
                    label={<div className="text-xs font-medium opacity-90">{t('holographic.tuning.feedbackStable.label', { value: game.settings.holographicFeedbackStable })}</div>}
                    help={t('holographic.tuning.feedbackStable.help')}
                  />
                  <div className="mt-2">
                    <Slider
                      value={[game.settings.holographicFeedbackStable]}
                      min={0.8}
                      max={0.995}
                      step={0.001}
                      onValueChange={(v) => game.setHolographicFeedbackStable(v[0] ?? game.settings.holographicFeedbackStable)}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <HelpRow
                    label={<div className="text-xs font-medium opacity-90">{t('holographic.tuning.feedbackTurb.label', { value: game.settings.holographicFeedbackTurb })}</div>}
                    help={t('holographic.tuning.feedbackTurb.help')}
                  />
                  <div className="mt-2">
                    <Slider
                      value={[game.settings.holographicFeedbackTurb]}
                      min={0.5}
                      max={0.98}
                      step={0.005}
                      onValueChange={(v) => game.setHolographicFeedbackTurb(v[0] ?? game.settings.holographicFeedbackTurb)}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <HelpRow
                    label={<div className="text-xs font-medium opacity-90">{t('holographic.tuning.deltaGain.label', { value: game.settings.holographicDeltaGain })}</div>}
                    help={t('holographic.tuning.deltaGain.help')}
                  />
                  <div className="mt-2">
                    <Slider
                      value={[game.settings.holographicDeltaGain]}
                      min={0}
                      max={6}
                      step={0.1}
                      onValueChange={(v) => game.setHolographicDeltaGain(v[0] ?? game.settings.holographicDeltaGain)}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <HelpRow
                    label={<div className="text-xs font-medium opacity-90">{t('holographic.tuning.sphereR.label', { value: game.settings.holographicSphereR })}</div>}
                    help={t('holographic.tuning.sphereR.help')}
                  />
                  <div className="mt-2">
                    <Slider
                      value={[game.settings.holographicSphereR]}
                      min={0.8}
                      max={3.5}
                      step={0.05}
                      onValueChange={(v) => game.setHolographicSphereR(v[0] ?? game.settings.holographicSphereR)}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <HelpRow
                    label={<div className="text-xs font-medium opacity-90">{t('holographic.tuning.sphereFade.label', { value: game.settings.holographicSphereFade })}</div>}
                    help={t('holographic.tuning.sphereFade.help')}
                  />
                  <div className="mt-2">
                    <Slider
                      value={[game.settings.holographicSphereFade]}
                      min={0.05}
                      max={2.0}
                      step={0.05}
                      onValueChange={(v) => game.setHolographicSphereFade(v[0] ?? game.settings.holographicSphereFade)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-2">
             <SectionTitle>{t('fluctuations.title')}</SectionTitle>
            <Card>
              <HelpRow
                label={
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={game.settings.lakeNoiseEnabled} onCheckedChange={(v) => game.setLakeNoiseEnabled(Boolean(v))} />
                     <span>{t('fluctuations.ambient.label')}</span>
                  </label>
                }
                 help={t('fluctuations.ambient.help')}
              />

               <div className="mt-3">
                <HelpRow
                  label={
                     <div className="text-xs font-medium opacity-90">
                       {t('fluctuations.intensity.label', { value: lakeNoisePercent })}
                     </div>
                   }
                    help={
                      <>
                        {t('fluctuations.intensity.help')}
                        <div className="mt-1 opacity-80">{dangerZoneNote}</div>
                      </>
                    }

                />
                <div className="mt-2">
                   <Slider
                     value={[lakeNoisePercent]}
                     min={0}
                     max={100}
                     step={1}
                     dangerRanges={mediumDangerZones.lakeNoise}
                     onValueChange={(v) => game.setLakeNoiseIntensityPercent(v[0] ?? lakeNoisePercent)}
                   />

                </div>
              </div>

               <div className="mt-3">
                <HelpRow
                  label={
                     <div className="text-xs font-medium opacity-90">
                       {t('fluctuations.size.label', { value: game.settings.lakeBlobSize })}
                     </div>
                   }
                   help={t('fluctuations.size.help')}
                />
                <div className="mt-2">
                  <Slider
                    value={[game.settings.lakeBlobSize]}
                    min={1}
                    max={12}
                    step={1}
                    onValueChange={(v) => game.setLakeBlobSize(v[0] ?? game.settings.lakeBlobSize)}
                  />
                </div>
              </div>

               <div className="mt-3">
                  <HelpRow
                     label={<div className="text-xs font-medium opacity-90">{t('fluctuations.shape.label')}</div>}
                     help={t('fluctuations.shape.help')}
                  />
                <div className="mt-2">
                  <Select
                    value={game.settings.lakeBlobShape}
                    onValueChange={(v) => game.setLakeBlobShape(v as typeof game.settings.lakeBlobShape)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.choose')} />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="square">{t('fluctuations.shape.square')}</SelectItem>
                       <SelectItem value="circle">{t('fluctuations.shape.circle')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

           <div className="space-y-2">
             <SectionTitle>{t('grid.title')}</SectionTitle>
              <LabeledSlider
                label={t('grid.size.label', { value: Math.min(game.settings.rows, game.settings.cols) })}
                help={t('grid.size.help')}
                value={Math.min(game.settings.rows, game.settings.cols)}
                min={500}
                max={10000}
                step={100}
                onChange={(v) => {
                  game.setRows(v);
                  game.setCols(v);
                }}
              />
              <LabeledSlider
                label={t('grid.cellSize.label', { value: game.settings.cellSize })}
                help={t('grid.cellSize.help')}
                value={game.settings.cellSize}
                min={4}
                max={20}
                step={1}
                onChange={(v) => game.setCellSize(v)}
              />
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <HelpRow
                  label={
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={game.settings.wrap} onCheckedChange={(v) => game.setWrap(Boolean(v))} />
                       <span>{t('grid.wrap.label')}</span>
                    </label>
                  }
                   help={t('grid.wrap.help')}
                />
              </Card>
              <Card>
                <HelpRow
                  label={
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={game.settings.showGrid} onCheckedChange={(v) => game.setShowGrid(Boolean(v))} />
                       <span>{t('grid.showGrid.label')}</span>
                    </label>
                  }
                   help={t('grid.showGrid.help')}
                />
              </Card>
            </div>
          </div>

          <div className="space-y-2">
            <SectionTitle>{t('appearance.title')}</SectionTitle>
            <Card>
              <HelpRow
                 label={<div className="text-xs font-medium opacity-90">{t('appearance.theme.label')}</div>}
                 help={t('appearance.theme.help')}
              />
              <div className="mt-2">
                 <Select value={theme} onValueChange={(v) => setTheme(v as ThemeName)}>
                   <SelectTrigger>
                     <SelectValue placeholder={t('common.choose')} />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="dark">{t('theme.dark')}</SelectItem>
                     <SelectItem value="light">{t('theme.light')}</SelectItem>
                     <SelectItem value="matrix">{t('theme.matrix')}</SelectItem>
                     <SelectItem value="solarized">{t('theme.solarized')}</SelectItem>
                     <SelectItem value="neon">{t('theme.neon')}</SelectItem>
                   </SelectContent>
                </Select>
              </div>
            </Card>
          </div>

           <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--field)] p-3 text-xs opacity-80">
             <div>{t('hints.drawing')}</div>
             <div className="mt-2">
               {t('hints.shortcuts')}
               <kbd className="rounded-md border border-[var(--kbd-border)] bg-[var(--field)] px-1.5 py-0.5 font-mono text-[11px] border-b-2">
                 Space
               </kbd>
                ={t('hints.shortcut.playPause')},

               <kbd className="rounded-md border border-[var(--kbd-border)] bg-[var(--field)] px-1.5 py-0.5 font-mono text-[11px] border-b-2">
                 Enter
               </kbd>
                ={t('hints.shortcut.step')},

               <kbd className="rounded-md border border-[var(--kbd-border)] bg-[var(--field)] px-1.5 py-0.5 font-mono text-[11px] border-b-2">
                 R
               </kbd>
                ={t('hints.shortcut.random')},

               <kbd className="rounded-md border border-[var(--kbd-border)] bg-[var(--field)] px-1.5 py-0.5 font-mono text-[11px] border-b-2">
                 C
               </kbd>
                ={t('hints.shortcut.stop')}
             </div>
           </div>

           <a
             className={cn(
               'inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--panel-border)] bg-[var(--field)]',
               'px-3 py-2 text-xs font-medium opacity-80 transition',
               'hover:-translate-y-0.5 hover:border-[var(--primary)] hover:opacity-100',
               'active:translate-y-0 active:scale-[0.99]'
             )}
             href="https://github.com/igisho/GameOfLife"
             target="_blank"
             rel="noreferrer"
           >
             <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
               <path
                 fill="currentColor"
                 d="M12 .5C5.65.5.5 5.8.5 12.32c0 5.22 3.29 9.65 7.86 11.22.58.11.79-.26.79-.57 0-.28-.01-1.03-.02-2.02-3.2.72-3.88-1.59-3.88-1.59-.52-1.37-1.27-1.73-1.27-1.73-1.04-.73.08-.72.08-.72 1.15.08 1.76 1.21 1.76 1.21 1.02 1.8 2.68 1.28 3.33.98.1-.76.4-1.28.72-1.57-2.55-.3-5.23-1.31-5.23-5.84 0-1.29.44-2.34 1.17-3.17-.12-.3-.51-1.51.11-3.15 0 0 .96-.32 3.14 1.21.91-.26 1.88-.39 2.85-.39.97 0 1.94.13 2.85.39 2.18-1.53 3.14-1.21 3.14-1.21.62 1.64.23 2.85.11 3.15.73.83 1.17 1.88 1.17 3.17 0 4.54-2.69 5.54-5.25 5.84.41.36.77 1.08.77 2.18 0 1.57-.01 2.84-.01 3.23 0 .31.21.68.8.57 4.56-1.58 7.85-6 7.85-11.22C23.5 5.8 18.35.5 12 .5z"
               />
             </svg>
             <span>{t('repo.link')}</span>
           </a>
         </div>
      </ScrollArea>
    </aside>
    </>
  );
}
