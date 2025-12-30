import { type ReactNode, useMemo } from 'react';
import Button from './ui/Button';
import Checkbox from './ui/Checkbox';
import ScrollArea from './ui/ScrollArea';
import Slider from './ui/Slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import type { ThemeName } from '../lib/themes';
import type { UseGameOfLifeResult } from '../game/useGameOfLife';

function SectionTitle({ children }: { children: string }) {
  return <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{children}</div>;
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--field)] p-3">{children}</div>;
}

function LabeledSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <Card>
      <div className="text-xs font-medium opacity-90">{label}</div>
      <div className="mt-2">
        <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0] ?? value)} />
      </div>
    </Card>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <Card>
      <label className="block text-xs font-medium opacity-90">{label}</label>
      <input
        className="mt-2 h-10 w-full rounded-xl border border-[var(--panel-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Card>
  );
}

type Props = {
  game: UseGameOfLifeResult;
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  onPlaceGlider: () => void;
  onPlacePulsar: () => void;
  onPlaceGun: () => void;
  onHide: () => void;
};

export default function Sidebar({ game, theme, setTheme, onPlaceGlider, onPlacePulsar, onPlaceGun, onHide }: Props) {
  const densityPercent = useMemo(() => Math.round(game.settings.density * 100), [game.settings.density]);
  const cellNoisePercent = useMemo(() => Math.round(game.settings.noiseIntensity * 100), [game.settings.noiseIntensity]);
  const lakeNoisePercent = useMemo(() => Math.round(game.settings.lakeNoiseIntensity * 100), [game.settings.lakeNoiseIntensity]);
  const hopHz = useMemo(() => Math.round(game.settings.hopHz * 10) / 10, [game.settings.hopHz]);
  const hopStrengthPercent = useMemo(
    () => Math.round(game.settings.hopStrength * 100),
    [game.settings.hopStrength]
  );
  const nucleationThreshold = useMemo(
    () => Math.round(game.settings.nucleationThreshold * 100) / 100,
    [game.settings.nucleationThreshold]
  );

  return (
    <aside className="h-full min-h-0 min-w-0 w-full overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] shadow-lg shadow-black/20 md:min-w-[450px]">
      <ScrollArea className="h-full w-full">
        <div className="w-full min-w-0 space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-6">Conwayova Hra života</h1>
              <p className="mt-0.5 text-xs opacity-70">Šumenie + kreslenie do mriežky</p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="inline-flex rounded-full border border-[var(--pill-border)] bg-[var(--field)] px-2 py-1 text-xs font-medium opacity-90">
                {game.running ? 'Running' : 'Paused'}
              </span>
              <Button className="h-9 w-9 rounded-full p-0" onClick={onHide} aria-label="Zavrieť menu">
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
            <SectionTitle>Ovládanie</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" onClick={() => game.toggleRunning()}>
                {game.running ? 'Pause' : 'Play'}
              </Button>
              <Button onClick={() => game.stepOnce()} disabled={game.running}>
                Step
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="danger" onClick={() => game.clearAll()}>
                Clear
              </Button>
              <Button onClick={() => game.randomize()}>Random</Button>
            </div>
          </div>

          <div className="space-y-2">
            <SectionTitle>Vzory</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              <Button className="h-10" onClick={onPlaceGlider}>
                Glider
              </Button>
              <Button className="h-10" onClick={onPlacePulsar}>
                Pulsar
              </Button>
              <Button className="h-10" onClick={onPlaceGun}>
                Gosper gun
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <SectionTitle>Simulácia</SectionTitle>
            <LabeledSlider
              label={
                <>
                  Rýchlosť (ms / krok): <span className="font-semibold">{game.settings.speedMs}</span>
                </>
              }
              value={game.settings.speedMs}
              min={10}
              max={400}
              step={1}
              onChange={(v) => game.setSpeedMs(v)}
            />
            <LabeledSlider
              label={
                <>
                  Hustota random: <span className="font-semibold">{densityPercent}%</span>
                </>
              }
              value={densityPercent}
              min={0}
              max={100}
              step={1}
              onChange={(v) => game.setDensityPercent(v)}
            />
          </div>

          <div className="space-y-2">
            <SectionTitle>Médium</SectionTitle>
            <Card>
              <div className="text-xs font-medium opacity-90">Režim</div>
              <div className="mt-2">
                <Select value={game.settings.mediumMode} onValueChange={(v) => game.setMediumMode(v as typeof game.settings.mediumMode)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyber" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Vypnuté</SelectItem>
                    <SelectItem value="visual">A: vlny (bez nukleácie)</SelectItem>
                    <SelectItem value="nucleation">B: nukleácia z média</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-3">
                <div className="text-xs font-medium opacity-90">
                  Frekvencia hopkania: <span className="font-semibold">{hopHz} Hz</span>
                </div>
                <div className="mt-2">
                  <Slider
                    value={[hopHz]}
                    min={0}
                    max={20}
                    step={0.1}
                    onValueChange={(v) => game.setHopHz(v[0] ?? hopHz)}
                  />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs font-medium opacity-90">
                  Vplyv bunky na médium: <span className="font-semibold">{hopStrengthPercent}%</span>
                </div>
                <div className="mt-2">
                  <Slider
                    value={[hopStrengthPercent]}
                    min={0}
                    max={300}
                    step={1}
                    onValueChange={(v) => game.setHopStrength((v[0] ?? hopStrengthPercent) / 100)}
                  />
                </div>
              </div>

              {game.settings.mediumMode === 'nucleation' ? (
                <div className="mt-3">
                  <div className="text-xs font-medium opacity-90">
                    Prah nukleácie: <span className="font-semibold">{nucleationThreshold}</span>
                  </div>
                  <div className="mt-2">
                    <Slider
                      value={[nucleationThreshold]}
                      min={0.05}
                      max={1}
                      step={0.01}
                      onValueChange={(v) => game.setNucleationThreshold(v[0] ?? nucleationThreshold)}
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={game.settings.antiparticlesEnabled}
                    onCheckedChange={(v) => game.setAntiparticlesEnabled(Boolean(v))}
                  />
                  <span>Anti-častice (experiment, iba v B režime)</span>
                </label>
              </div>
            </Card>
          </div>

          <div className="space-y-2">
            <SectionTitle>Šumenie buniek</SectionTitle>
            <Card>
              <label className={`flex items-center gap-2 text-sm ${game.settings.mediumMode === 'nucleation' ? 'opacity-50' : ''}`}>
                <Checkbox
                  checked={game.settings.noiseEnabled}
                  disabled={game.settings.mediumMode === 'nucleation'}
                  onCheckedChange={(v) => game.setNoiseEnabled(Boolean(v))}
                />
                <span>Šumenie počas hry (v bunke)</span>
              </label>

              <div className="mt-3">
                <div className="text-xs font-medium opacity-90">
                  Intenzita: <span className="font-semibold">{cellNoisePercent}%</span>
                </div>
                <div className="mt-2">
                  <Slider
                    value={[cellNoisePercent]}
                    min={0}
                    max={100}
                    step={1}
                    disabled={game.settings.mediumMode === 'nucleation'}
                    onValueChange={(v) => game.setNoiseIntensityPercent(v[0] ?? cellNoisePercent)}
                  />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs font-medium opacity-90">
                  Veľkosť objektov (px buniek): <span className="font-semibold">{game.settings.blobSize}</span>
                </div>
                <div className="mt-2">
                  <Slider
                    value={[game.settings.blobSize]}
                    min={1}
                    max={12}
                    step={1}
                    disabled={game.settings.mediumMode === 'nucleation'}
                    onValueChange={(v) => game.setBlobSize(v[0] ?? game.settings.blobSize)}
                  />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs font-medium opacity-90">Tvar objektu</div>
                <div className="mt-2">
                  <Select
                    value={game.settings.blobShape}
                    disabled={game.settings.mediumMode === 'nucleation'}
                    onValueChange={(v) => game.setBlobShape(v as typeof game.settings.blobShape)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Štvorec</SelectItem>
                      <SelectItem value="circle">Kruh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-2">
            <SectionTitle>Šum jazera</SectionTitle>
            <Card>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={game.settings.lakeNoiseEnabled} onCheckedChange={(v) => game.setLakeNoiseEnabled(Boolean(v))} />
                <span>Ambientný šum jazera</span>
              </label>

              <div className="mt-3">
                <div className="text-xs font-medium opacity-90">
                  Intenzita: <span className="font-semibold">{lakeNoisePercent}%</span>
                </div>
                <div className="mt-2">
                  <Slider
                    value={[lakeNoisePercent]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => game.setLakeNoiseIntensityPercent(v[0] ?? lakeNoisePercent)}
                  />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs font-medium opacity-90">
                  Veľkosť šumu (px buniek): <span className="font-semibold">{game.settings.lakeBlobSize}</span>
                </div>
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
                <div className="text-xs font-medium opacity-90">Tvar šumu</div>
                <div className="mt-2">
                  <Select value={game.settings.lakeBlobShape} onValueChange={(v) => game.setLakeBlobShape(v as typeof game.settings.lakeBlobShape)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Štvorec</SelectItem>
                      <SelectItem value="circle">Kruh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-2">
            <SectionTitle>Grid</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Riadky" value={game.settings.rows} min={10} max={1000} onChange={(v) => game.setRows(v)} />
              <NumberField label="Stĺpce" value={game.settings.cols} min={10} max={1000} onChange={(v) => game.setCols(v)} />
            </div>
            <LabeledSlider
              label={
                <>
                  Veľkosť bunky (px): <span className="font-semibold">{game.settings.cellSize}</span>
                </>
              }
              value={game.settings.cellSize}
              min={4}
              max={20}
              step={1}
              onChange={(v) => game.setCellSize(v)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={game.settings.wrap} onCheckedChange={(v) => game.setWrap(Boolean(v))} />
                  <span>Wrap okraje (torus)</span>
                </label>
              </Card>
              <Card>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={game.settings.showGrid} onCheckedChange={(v) => game.setShowGrid(Boolean(v))} />
                  <span>Zobraziť mriežku</span>
                </label>
              </Card>
            </div>
          </div>

          <div className="space-y-2">
            <SectionTitle>Vzhľad</SectionTitle>
            <Card>
              <div className="text-xs font-medium opacity-90">Farebná schéma</div>
              <div className="mt-2">
                <Select value={theme} onValueChange={(v) => setTheme(v as ThemeName)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyber" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="matrix">Matrix</SelectItem>
                    <SelectItem value="solarized">Solarized</SelectItem>
                    <SelectItem value="neon">Neon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </div>

          <div className="space-y-2">
            <SectionTitle>Rozmer</SectionTitle>
            <div className="text-sm leading-5 opacity-90">{`${game.settings.rows} × ${game.settings.cols}`}</div>
          </div>

          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--field)] p-3 text-xs opacity-80">
            <div>Kreslenie: ľavé tlačidlo pridáva, pravé maže.</div>
            <div className="mt-2">
              Skratky:
              <kbd className="rounded-md border border-[var(--kbd-border)] bg-[var(--field)] px-1.5 py-0.5 font-mono text-[11px] border-b-2">
                Space
              </kbd>
              =Play/Pause,
              <kbd className="rounded-md border border-[var(--kbd-border)] bg-[var(--field)] px-1.5 py-0.5 font-mono text-[11px] border-b-2">
                Enter
              </kbd>
              =Step,
              <kbd className="rounded-md border border-[var(--kbd-border)] bg-[var(--field)] px-1.5 py-0.5 font-mono text-[11px] border-b-2">
                R
              </kbd>
              =Random,
              <kbd className="rounded-md border border-[var(--kbd-border)] bg-[var(--field)] px-1.5 py-0.5 font-mono text-[11px] border-b-2">
                C
              </kbd>
              =Clear
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
