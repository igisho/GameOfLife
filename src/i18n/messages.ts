import type { Locale } from './locales';

export type Messages = Record<string, string>;

// Dot-separated keys.
export const MESSAGES: Record<Locale, Messages> = {
  en: {
    'meta.title': 'Spacetime Medium – Game of Life',

    'common.choose': 'Choose',
    'common.close': 'Close',
    'common.off': 'Off',

    'language.label': 'Language',
    'language.en': 'English',
    'language.de': 'Deutsch',
    'language.fr': 'Français',
    'language.sk': 'Slovenčina',

    'start.title': 'Start life?',
    'start.subtitle': 'Pick a fragment.',
    'start.advanced': 'Advanced start',
    'start.ariaStartPattern': 'Start: {{name}}',
    'start.pattern.blinker': 'Blinker',
    'start.pattern.blinker.subtitle': '3 in a row',
    'start.pattern.l3': 'L',
    'start.pattern.l3.subtitle': 'OO / .O',
    'start.pattern.doubleBlock': 'Double block',
    'start.pattern.doubleBlock.subtitle': 'OO / .OO',

    'start.pattern.blinkerPair': 'Blinker ±',
    'start.pattern.blinkerPair.subtitle': '3 + 3 (stack)',
    'start.pattern.l3Pair': 'L ±',
    'start.pattern.l3Pair.subtitle': '3 + 3 (diagonal)',
    'start.pattern.doubleBlockPair': 'Double block ±',
    'start.pattern.doubleBlockPair.subtitle': '6 + 6 (blocks)',

    'repo.link': 'GitHub repository',

    'app.openMenu': 'Open menu',
    'app.closeMenu': 'Close menu',
    'app.status.running': 'Running',
    'app.status.paused': 'Paused',
    'app.play': 'Play',
    'app.pause': 'Pause',
    'app.generation': 'Generation',
    'app.medium': 'Medium',
    'app.mediumAvgAmplitude': 'Medium average amplitude',
    'app.mediumPreview.expand': 'Expand medium preview',
    'app.mediumPreview.tab.surface': 'Surface',
    'app.mediumPreview.tab.holographic': 'Holographic',
    'app.cellCounts': 'Cell counts',

    'medium.legend.title': 'Excitation scale (|u|)',
    'medium.legend.body': 'p95: {{p95}} · p99: {{p99}} · max: {{max}}',
    'app.liveCellsTitle': 'Live cells (matter)',
    'app.antiCellsTitle': 'Live anti-cells (antimatter)',

    'sidebar.title': 'Spacetime Medium',
    'sidebar.subtitle': 'Game of Life + excitations (matter/antimatter)',
    'sidebar.quickStart.title': 'Quick start',

    'sidebar.info.tooltip': 'Ontological foundation',
    'sidebar.info.button': 'Info',

    'info.modal.ariaLabel': 'Ontological foundation',
    'info.modal.title': 'Ontological foundation',
    'info.modal.subtitle': 'A summary of the “dynamic spacetime medium” framework',

    'info.intro':
      'This game is a visual simulation inspired by an ontological framework in which matter, interactions, and “spacetime” are emergent modes of one dynamic medium. It is not a proof or a physical prediction; it is a tool for intuitively exploring thresholds, memory, and excitations.',

    'info.postulate.title': 'Medium postulate',
    'info.postulate.0': 'There is a single fundamental medium: dynamic, continuous, nonlinear, and with memory.',
    'info.postulate.1': 'The global state of the medium is primary; local states are projections of its organization.',
    'info.postulate.2': 'Separability is an approximation valid only in some regimes.',

    'info.timeSpace.title': 'Time, space, excitations',
    'info.timeSpace.0': 'Time measures change in the medium’s global state; space is a relational structure of degrees of freedom.',
    'info.timeSpace.1': '“Particles” are not inserted objects: they are stable modes of the medium’s behavior (processes).',
    'info.timeSpace.2a': 'Fluctuations may cross a critical threshold and stabilize (in UI:',
    'info.timeSpace.2b': 'Nucleation threshold',
    'info.timeSpace.2c': ').',

    'info.antimatter.title': 'Antimatter and annihilation',
    'info.antimatter.0':
      'If excitations carry an oriented/topological sign, an antiparticle is the same mode with opposite orientation.',
    'info.antimatter.1':
      'Annihilation is the disappearance of a stable mode and a reconfiguration of the medium: energy returns to the field.',
    'info.antimatter.2':
      'In this simulation it appears as impulsive driving of the medium during local events.',

    'info.simNote.title': 'Simulation note',
    'info.simNote.0': 'The colored “sea” shows the signed polarity of the wave field (both positive and negative components).',
    'info.simNote.1':
      '“Hopping” is modeled as periodic local impacts (impulses) bound to sources, not as a global sine-wave flip.',

    'info.modelMath.title': 'Current model (exact implementation)',
    'info.modelMath.subtitle':
      'Auto-generated description of the exact rules currently running (Conway + medium equations), including the substituted values from settings.',
    'info.modelMath.open': 'Show formulas and parameters',
    'info.modelMath.warning':
      'Note: this is a technical description of the simulation (not a physical claim). The optional “numerical amplitude limiter” is a stability tool and can be turned off.',
    'info.modelMath.block.params': 'Parameters (current)',
    'info.modelMath.block.conway': 'Conway automaton (exact rules)',
    'info.modelMath.block.medium': 'Medium (exact step)',
    'info.modelMath.block.nucleation': 'Nucleation from medium (exact algorithm)',

    'helpButton.show': 'Show explanation',
    'helpButton.hide': 'Hide explanation',

    'controls.title': 'Controls',
    'controls.prev.tooltip': 'Prev (step back)',
    'controls.prev.aria': 'Prev',
    'controls.next.tooltip': 'Next (step)',
    'controls.next.aria': 'Next',
    'controls.random.tooltip': 'Random',
    'controls.random.aria': 'Random',
    'controls.stop.tooltip': 'Stop (clear + reset medium)',
    'controls.stop.aria': 'Stop',

    'simulation.title': 'Simulation',
    'simulation.speed': 'Evolution speed (ms/step): {{value}}',
    'simulation.speedHelp': 'Time between automaton steps. Lower = faster evolution and faster medium changes.',
    'simulation.density': 'Density (Random): {{value}}%',
    'simulation.densityHelp':
      'How many cells are created by Random. Higher = more collisions and more annihilations.',

    'medium.title': 'Medium (wave field)',
    'medium.mode.label': 'Medium mode',
    'medium.mode.help':
      'Enables the wave medium. In “Nucleation” mode the medium can create new cores (matter/antimatter) when the threshold is exceeded.',
    'medium.mode.placeholder': 'Choose',
    'medium.mode.off': 'Off',
    'medium.mode.nucleation': 'Nucleation from medium',

    'medium.hopHz.label': 'Impact frequency: {{value}} Hz',
    'medium.hopHz.help':
      'How often per second sources (cells/anti-cells) deliver an impulsive “impact” into the medium. Higher = denser waves and more frequent threshold events.',

    'medium.hopStrength.label': 'Source impact strength: {{value}}%',
    'medium.hopStrength.help':
      'Impact impulse size. Higher = larger wave amplitudes around sources; watch the “sea” change color and nucleation happen more often.',

    'medium.stepsPerGeneration.label': 'Medium steps per generation: {{value}}',
    'medium.stepsPerGeneration.help':
      'How many medium integration substeps run per Conway generation. Higher = smoother/more stable medium evolution without changing total medium time per generation.',

    'medium.nucleationThreshold.label': 'Nucleation threshold: {{value}}',
    'medium.nucleationThreshold.help':
      'Critical (smoothed) amplitude at which a fluctuation stabilizes into a core. Lower = matter/antimatter forms more easily; higher = rarer, more stable nucleation.',

    'medium.antiparticles.label': 'Anti-particles (opposite orientation)',
    'medium.antiparticles.help':
      'Allows the negative polarity of the medium to form anti-cores (antimatter). Off = only positive cores nucleate.',

    'medium.tuning.title': 'Dynamics tuning',
    'medium.annihilationEnergy.label': 'Annihilation energy: {{value}}%',
    'medium.annihilationEnergy.help':
      'How much energy returns to the medium (impulse) during a cell+anti-cell collision. Higher = more pronounced wave “bursts” and more secondary fluctuations.',

    'medium.memoryRate.label': 'Medium memory (rate): {{value}}%',
    'medium.memoryRate.help':
      'How quickly local memory adapts to the current field. Higher = longer reverberations and more “history” in medium behavior.',

    'medium.memoryCoupling.label': 'Memory coupling: {{value}}',
    'medium.memoryCoupling.help':
      'How strongly memory feeds back into the dynamics. Higher = more pronounced structures and wave “guidance”; too high can destabilize the system.',

    'medium.nonlinearity.label': 'Medium nonlinearity: {{value}}',
    'medium.nonlinearity.help':
      'Nonlinear feedback that changes behavior at larger amplitudes. Higher = sharper phenomena and a different propagation character; too high may damp large waves.',

    'medium.amplitudeLimiter.label': 'Numerical amplitude limiter: {{value}}',
    'medium.amplitudeLimiter.help':
      'Optional numerical stability tool (soft compression of the field amplitude). Set to Off for the most theory-faithful unbounded medium; raise it only if the simulation becomes unstable.',

    'fluctuations.title': 'Medium fluctuations',
    'fluctuations.ambient.label': 'Ambient fluctuations',
    'fluctuations.ambient.help':
      'Random small impulses into the medium (fluctuations). Turn on if you want structures to form “spontaneously” even without drawing.',

    'fluctuations.intensity.label': 'Intensity: {{value}}%',
    'fluctuations.intensity.help':
      'Fluctuation strength. Higher = more disturbance in the “sea” and more threshold transitions (nucleations).',

    'fluctuations.size.label': 'Fluctuation size (px): {{value}}',
    'fluctuations.size.help':
      'Spatial extent of a fluctuation. Smaller = fine grain; larger = bigger “bubbles” in the medium.',

    'fluctuations.shape.label': 'Fluctuation shape',
    'fluctuations.shape.help': 'Geometry of the local impulse (circle/square). Changes the wavefront character.',
    'fluctuations.shape.square': 'Square',
    'fluctuations.shape.circle': 'Circle',

    'grid.title': 'Grid',
    'grid.size.label': 'Grid size (1:1): {{value}}',
    'grid.size.help':
      'Sets rows and columns together (square grid). Higher = more detail, but significantly more compute and memory.',
    'grid.cellSize.label': 'Cell size (px): {{value}}',
    'grid.cellSize.help':
      'Display scale (zoom). Smaller = more cells on screen (heavier); larger = easier to read.',
    'grid.wrap.label': 'Wrap edges (torus)',
    'grid.wrap.help':
      'On = edges connect (torus). Off = edges are boundaries; waves/structures behave differently near walls.',
    'grid.showGrid.label': 'Show grid',
    'grid.showGrid.help': 'Visual aid only. Turn off for a cleaner view of the wave field.',

    'appearance.title': 'Appearance',
    'appearance.theme.label': 'Color scheme',
    'appearance.theme.help':
      'Changes CSS color variables (cells, grid, wave polarity). Does not affect dynamics.',

    'theme.dark': 'Dark',
    'theme.light': 'Light',
    'theme.matrix': 'Matrix',
    'theme.solarized': 'Solarized',
    'theme.neon': 'Neon',

    'hints.drawing': 'Drawing: left button adds, right button erases.',
    'hints.shortcuts': 'Shortcuts:',
    'hints.shortcut.playPause': 'Play/Pause',
    'hints.shortcut.step': 'Step',
    'hints.shortcut.random': 'Random',
    'hints.shortcut.stop': 'Stop',

    'slider.dangerZoneNote':
      'The tinted part of the slider marks a regime where the model becomes physically implausible (you are mostly seeing numerical clamping/saturation rather than meaningful dynamics).',
  },

  sk: {
    'meta.title': 'Časopriestorové médium – hra života',

    'common.choose': 'Vyber',
    'common.close': 'Zavrieť',
    'common.off': 'Vypnuté',

    'language.label': 'Jazyk',
    'language.en': 'English',
    'language.de': 'Deutsch',
    'language.fr': 'Français',
    'language.sk': 'Slovenčina',

    'start.title': 'Začať život?',
    'start.subtitle': 'Vyber jeden fragment.',
    'start.advanced': 'Rozšírený štart',
    'start.ariaStartPattern': 'Začať: {{name}}',
    'start.pattern.blinker': 'Blinker',
    'start.pattern.blinker.subtitle': '3 v rade',
    'start.pattern.l3': 'L',
    'start.pattern.l3.subtitle': 'OO / .O',
    'start.pattern.doubleBlock': 'Dvojblok',
    'start.pattern.doubleBlock.subtitle': 'OO / .OO',

    'start.pattern.blinkerPair': 'Blinker ±',
    'start.pattern.blinkerPair.subtitle': '3 + 3 (nad sebou)',
    'start.pattern.l3Pair': 'L ±',
    'start.pattern.l3Pair.subtitle': '3 + 3 (diagonála)',
    'start.pattern.doubleBlockPair': 'Dvojblok ±',
    'start.pattern.doubleBlockPair.subtitle': '6 + 6 (bloky)',

    'repo.link': 'Repozitár na GitHube',

    'app.openMenu': 'Otvoriť menu',
    'app.closeMenu': 'Zavrieť menu',
    'app.status.running': 'Beží',
    'app.status.paused': 'Pauza',
    'app.play': 'Play',
    'app.pause': 'Pause',
    'app.generation': 'Generácia',
    'app.medium': 'Médium',
    'app.mediumAvgAmplitude': 'Priemerná amplitúda média',
    'app.mediumPreview.expand': 'Zväčšiť náhľad média',
    'app.mediumPreview.tab.surface': 'Povrch',
    'app.mediumPreview.tab.holographic': 'Holografia',
    'app.cellCounts': 'Počty buniek',

    'medium.legend.title': 'Mierka excitácie (|u|)',
    'medium.legend.body': 'p95: {{p95}} · p99: {{p99}} · max: {{max}}',
    'app.liveCellsTitle': 'Živé bunky (hmota)',
    'app.antiCellsTitle': 'Živé antibunky (antihmota)',

    'sidebar.title': 'Časopriestorové médium',
    'sidebar.subtitle': 'Hra života + excitácie (hmota/antihmota)',
    'sidebar.quickStart.title': 'Rýchle spustenie',

    'sidebar.info.tooltip': 'Ontologický základ',
    'sidebar.info.button': 'Info',

    'info.modal.ariaLabel': 'Ontologický základ',
    'info.modal.title': 'Ontologický základ',
    'info.modal.subtitle': 'Zhrnutie rámca „dynamické časopriestorové médium“',

    'info.intro':
      'Táto hra je vizuálna simulácia inšpirovaná ontologickým rámcom, v ktorom sú hmota, interakcie a „časopriestor“ emergentné režimy jedného dynamického média. Nejde o dôkaz ani fyzikálnu predpoveď; je to nástroj na intuitívne skúmanie prahov, pamäte a excitácií.',

    'info.postulate.title': 'Postulát média',
    'info.postulate.0': 'Existuje jediné fundamentálne médium: dynamické, kontinuálne, nelineárne a s pamäťou.',
    'info.postulate.1': 'Globálny stav média je primárny; lokálne stavy sú projekcie jeho usporiadania.',
    'info.postulate.2': 'Separovateľnosť je aproximácia platná len v niektorých režimoch.',

    'info.timeSpace.title': 'Čas, priestor, excitácie',
    'info.timeSpace.0': 'Čas je miera zmeny globálneho stavu média; priestor je vzťahová štruktúra stupňov voľnosti.',
    'info.timeSpace.1': '„Častice“ nie sú vložené objekty: sú stabilné režimy správania média (procesy).',
    'info.timeSpace.2a': 'Fluktuácie môžu prekročiť kritický prah a stabilizovať sa (v UI:',
    'info.timeSpace.2b': 'Prah nukleácie',
    'info.timeSpace.2c': ').',

    'info.antimatter.title': 'Antihmota a anihilácia',
    'info.antimatter.0': 'Ak excitácie nesú orientovaný/topologický znak, antičastica je ten istý režim s opačnou orientáciou.',
    'info.antimatter.1': 'Anihilácia je zánik stabilného režimu a rekonfigurácia média: energia sa vracia do poľa.',
    'info.antimatter.2': 'V tejto simulácii sa to prejavuje impulzným budením média pri lokálnych udalostiach.',

    'info.simNote.title': 'Poznámka k simulácii',
    'info.simNote.0': 'Farebné „more“ zobrazuje podpísanú polaritu vlnového poľa (kladnú aj zápornú zložku).',
    'info.simNote.1':
      '„Hopkanie“ je modelované ako periodické lokálne dopady (impulzy) viazané na zdroje, nie ako globálny sínusový flip.',

    'info.modelMath.title': 'Aktuálny model (presná implementácia)',
    'info.modelMath.subtitle':
      'Toto je automaticky generovaný výpis toho, čo práve beží v kóde (Conway pravidlá + rovnice média), vrátane dosadených hodnôt z nastavení.',
    'info.modelMath.open': 'Zobraziť vzorce a parametre',
    'info.modelMath.warning':
      'Pozor: toto je presný technický popis simulácie (nie tvrdenie o fyzike). Voliteľný „numerický limit amplitúdy“ je stabilizačná pomôcka a dá sa vypnúť.',
    'info.modelMath.block.params': 'Parametre (aktuálne)',
    'info.modelMath.block.conway': 'Conway automat (presné pravidlá)',
    'info.modelMath.block.medium': 'Médium (presný krok)',
    'info.modelMath.block.nucleation': 'Nukleácia z média (presný algoritmus)',

    'helpButton.show': 'Zobraziť vysvetlenie',
    'helpButton.hide': 'Skryť vysvetlenie',

    'controls.title': 'Ovládanie',
    'controls.prev.tooltip': 'Prev (krok späť)',
    'controls.prev.aria': 'Prev',
    'controls.next.tooltip': 'Next (krok)',
    'controls.next.aria': 'Next',
    'controls.random.tooltip': 'Random',
    'controls.random.aria': 'Random',
    'controls.stop.tooltip': 'Stop (vymazať + reset média)',
    'controls.stop.aria': 'Stop',

    'simulation.title': 'Simulácia',
    'simulation.speed': 'Rýchlosť evolúcie (ms/krok): {{value}}',
    'simulation.speedHelp': 'Interval medzi krokmi automatu. Nižšie = rýchlejšia evolúcia a rýchlejšie zmeny v médiu.',
    'simulation.density': 'Hustota (Random): {{value}}%',
    'simulation.densityHelp': 'Koľko buniek sa vytvorí pri Random. Vyššie = viac zrážok a viac anihilácií.',

    'medium.title': 'Médium (vlnové pole)',
    'medium.mode.label': 'Režim média',
    'medium.mode.help':
      'Zapína vlnové médium. V režime „Nukleácia“ môže médium pri prekročení prahu vytvárať nové jadrá (hmotu/antihmotu).',
    'medium.mode.placeholder': 'Vyber',
    'medium.mode.off': 'Vypnuté',
    'medium.mode.nucleation': 'Nukleácia z média',

    'medium.hopHz.label': 'Frekvencia dopadov: {{value}} Hz',
    'medium.hopHz.help':
      'Ako často za sekundu zdroje (bunky/antibunky) urobia impulzný „dopad“ do média. Vyššie = hustejšie vlny a častejšie prahové udalosti.',

    'medium.hopStrength.label': 'Sila dopadu zdroja: {{value}}%',
    'medium.hopStrength.help':
      'Veľkosť impulzu pri dopade. Vyššie = väčšia amplitúda vĺn okolo zdroja; sleduj zmeny farby „mora“ a častejšiu nukleáciu.',

    'medium.stepsPerGeneration.label': 'Kroky média na generáciu: {{value}}',
    'medium.stepsPerGeneration.help':
      'Koľko integračných podkrokov média sa vykoná na jeden Conway krok. Vyššie = hladšia/stabilnejšia evolúcia média bez zmeny celkového „času“ média na generáciu.',

    'medium.nucleationThreshold.label': 'Prah nukleácie: {{value}}',
    'medium.nucleationThreshold.help':
      'Kritická amplitúda (po vyhladení), pri ktorej sa fluktuácia média stabilizuje do jadra. Nižšie = ľahšie vzniká hmota/antihmota; vyššie = stabilnejšie, zriedkavejšie nukleácie.',

    'medium.antiparticles.label': 'Anti-častice (opačná orientácia)',
    'medium.antiparticles.help':
      'Povoľuje negatívnu polaritu média vytvárať anti-jadrá (antihmotu). Vypnuté = nukleujú len kladné jadrá.',

    'medium.tuning.title': 'Ladenie dynamiky',
    'medium.annihilationEnergy.label': 'Energia anihilácie: {{value}}%',
    'medium.annihilationEnergy.help':
      'Koľko energie sa pri strete bunka+antibunka vráti späť do média (impulz). Vyššie = výraznejšie vlnové „výbuchy“ a viac sekundárnych fluktuácií.',

    'medium.memoryRate.label': 'Pamäť média (miera): {{value}}%',
    'medium.memoryRate.help':
      'Ako rýchlo sa lokálna pamäť prispôsobuje aktuálnemu poľu. Vyššie = dlhšie dozvuky a viac „histórie“ v správaní média.',

    'medium.memoryCoupling.label': 'Väzba pamäte: {{value}}',
    'medium.memoryCoupling.help':
      'Ako silno pamäť spätne pôsobí na dynamiku. Vyššie = výraznejšie štruktúry a „vodítko“ vĺn; príliš vysoko môže systém rozkmitať.',

    'medium.nonlinearity.label': 'Nelinearita média: {{value}}',
    'medium.nonlinearity.help':
      'Nelineárna spätná väzba, ktorá mení správanie pri väčších amplitúdach. Vyššie = ostrejšie javy a iný charakter šírenia; príliš vysoko môže tlmiť veľké vlny.',

    'medium.amplitudeLimiter.label': 'Numerický limit amplitúdy: {{value}}',
    'medium.amplitudeLimiter.help':
      'Voliteľná numerická stabilizácia (mäkká kompresia amplitúdy poľa). Nastav na Vypnuté pre najvernejší (neobmedzený) režim podľa teórie; zvyšuj len ak sa simulácia začne rozpadávať.',

    'fluctuations.title': 'Fluktuácie média',
    'fluctuations.ambient.label': 'Ambientné fluktuácie',
    'fluctuations.ambient.help':
      'Náhodné malé impulzy do média (fluktuácie). Zapni, ak chceš „samovoľné“ vznikanie štruktúr aj bez kreslenia.',

    'fluctuations.intensity.label': 'Intenzita: {{value}}%',
    'fluctuations.intensity.help': 'Sila fluktuácií. Vyššie = viac rušenia v „mori“ a viac prahových prechodov (nukleácií).',

    'fluctuations.size.label': 'Veľkosť fluktuácie (px): {{value}}',
    'fluctuations.size.help': 'Priestorový rozsah fluktuácie. Menšie = jemné zrnenie; väčšie = väčšie „bubliny“ v médiu.',

    'fluctuations.shape.label': 'Tvar fluktuácie',
    'fluctuations.shape.help': 'Geometria lokálneho impulzu (kruh/štvorec). Mení charakter vlnového frontu.',
    'fluctuations.shape.square': 'Štvorec',
    'fluctuations.shape.circle': 'Kruh',

    'grid.title': 'Grid',
    'grid.size.label': 'Rozmer mriežky (1:1): {{value}}',
    'grid.size.help': 'Nastaví počet riadkov aj stĺpcov naraz (štvorcová mriežka). Vyššie = viac detailu, ale výrazne viac výpočtu a pamäte.',
    'grid.cellSize.label': 'Veľkosť bunky (px): {{value}}',
    'grid.cellSize.help': 'Mierka zobrazenia (zoom). Menšie = viac buniek na obrazovke (náročnejšie); väčšie = prehľadnejšie.',
    'grid.wrap.label': 'Wrap okraje (torus)',
    'grid.wrap.help': 'Zapnuté = okraje sú spojené (torus). Vypnuté = okraj je hranica; vlny/štruktúry sa správajú inak pri stene.',
    'grid.showGrid.label': 'Zobraziť mriežku',
    'grid.showGrid.help': 'Iba vizuálna pomôcka. Vypni pre čistejší pohľad na vlnové pole.',

    'appearance.title': 'Vzhľad',
    'appearance.theme.label': 'Farebná schéma',
    'appearance.theme.help': 'Mení CSS premenné farieb (bunky, grid, polarita vĺn). Nemá vplyv na dynamiku.',

    'theme.dark': 'Dark',
    'theme.light': 'Light',
    'theme.matrix': 'Matrix',
    'theme.solarized': 'Solarized',
    'theme.neon': 'Neon',

    'hints.drawing': 'Kreslenie: ľavé tlačidlo pridáva, pravé maže.',
    'hints.shortcuts': 'Skratky:',
    'hints.shortcut.playPause': 'Play/Pause',
    'hints.shortcut.step': 'Step',
    'hints.shortcut.random': 'Random',
    'hints.shortcut.stop': 'Stop',

    'slider.dangerZoneNote':
      'Zafarbená časť slideru označuje režim, kde sa model stáva fyzikálne neplauzibilný (uvidíš skôr numerické saturovanie/clamp než zmysluplnú dynamiku).',
  },

  de: {
    'meta.title': 'Raumzeit‑Medium – Game of Life',

    'common.choose': 'Auswählen',
    'common.close': 'Schließen',

    'language.label': 'Sprache',
    'language.en': 'English',
    'language.de': 'Deutsch',
    'language.fr': 'Français',
    'language.sk': 'Slovenčina',

    'start.title': 'Leben starten?',
    'start.subtitle': 'Wähle ein Fragment.',
    'start.advanced': 'Erweiterter Start',
    'start.ariaStartPattern': 'Start: {{name}}',
    'start.pattern.blinker': 'Blinker',
    'start.pattern.blinker.subtitle': '3 in einer Reihe',
    'start.pattern.l3': 'L',
    'start.pattern.l3.subtitle': 'OO / .O',
    'start.pattern.doubleBlock': 'Doppelblock',
    'start.pattern.doubleBlock.subtitle': 'OO / .OO',

    'start.pattern.blinkerPair': 'Blinker ±',
    'start.pattern.blinkerPair.subtitle': '3 + 3 (gestapelt)',
    'start.pattern.l3Pair': 'L ±',
    'start.pattern.l3Pair.subtitle': '3 + 3 (diagonal)',
    'start.pattern.doubleBlockPair': 'Doppelblock ±',
    'start.pattern.doubleBlockPair.subtitle': '6 + 6 (Blöcke)',

    'repo.link': 'GitHub‑Repository',

    'app.openMenu': 'Menü öffnen',
    'app.closeMenu': 'Menü schließen',
    'app.status.running': 'Läuft',
    'app.status.paused': 'Pausiert',
    'app.play': 'Start',
    'app.pause': 'Pause',
    'app.generation': 'Generation',
    'app.medium': 'Medium',
    'app.mediumAvgAmplitude': 'Durchschnittsamplitude des Mediums',
    'app.mediumPreview.expand': 'Medium-Vorschau vergrößern',
    'app.mediumPreview.tab.surface': 'Oberfläche',
    'app.mediumPreview.tab.holographic': 'Holografisch',
    'app.cellCounts': 'Zellzahlen',
    'app.liveCellsTitle': 'Lebende Zellen (Materie)',
    'app.antiCellsTitle': 'Lebende Anti‑Zellen (Antimaterie)',

    'sidebar.title': 'Raumzeit‑Medium',
    'sidebar.subtitle': 'Game of Life + Anregungen (Materie/Antimaterie)',
    'sidebar.quickStart.title': 'Schnellstart',

    'sidebar.info.tooltip': 'Ontologische Grundlage',
    'sidebar.info.button': 'Info',

    'info.modal.ariaLabel': 'Ontologische Grundlage',
    'info.modal.title': 'Ontologische Grundlage',
    'info.modal.subtitle': 'Kurzüberblick über das Rahmenmodell „dynamisches Raumzeit‑Medium“',

    'info.intro':
      'Dieses Spiel ist eine visuelle Simulation, inspiriert von einem ontologischen Rahmen, in dem Materie, Wechselwirkungen und „Raumzeit“ emergente Modi eines dynamischen Mediums sind. Es ist weder Beweis noch physikalische Vorhersage; es ist ein Werkzeug, um Schwellenwerte, Gedächtnis und Anregungen intuitiv zu erkunden.',

    'info.postulate.title': 'Postulat des Mediums',
    'info.postulate.0': 'Es gibt ein einziges fundamentales Medium: dynamisch, kontinuierlich, nichtlinear und mit Gedächtnis.',
    'info.postulate.1': 'Der globale Zustand des Mediums ist primär; lokale Zustände sind Projektionen seiner Ordnung.',
    'info.postulate.2': 'Separierbarkeit ist nur in manchen Regimen eine brauchbare Näherung.',

    'info.timeSpace.title': 'Zeit, Raum, Anregungen',
    'info.timeSpace.0': 'Zeit misst die Änderung des globalen Zustands; Raum ist eine relationale Struktur von Freiheitsgraden.',
    'info.timeSpace.1': '„Teilchen“ sind keine eingesetzten Objekte: Es sind stabile Verhaltensmoden des Mediums (Prozesse).',
    'info.timeSpace.2a': 'Fluktuationen können eine kritische Schwelle überschreiten und stabil werden (im UI:',
    'info.timeSpace.2b': 'Keimbildungsschwelle',
    'info.timeSpace.2c': ').',

    'info.antimatter.title': 'Antimaterie und Annihilation',
    'info.antimatter.0':
      'Wenn Anregungen ein orientiertes/topologisches Vorzeichen tragen, ist ein Antiteilchen derselbe Modus mit entgegengesetzter Orientierung.',
    'info.antimatter.1':
      'Annihilation ist das Verschwinden eines stabilen Modus und eine Rekonfiguration des Mediums: Energie fließt zurück ins Feld.',
    'info.antimatter.2':
      'In dieser Simulation zeigt sich das als impulsives Antreiben des Mediums bei lokalen Ereignissen.',

    'info.simNote.title': 'Hinweis zur Simulation',
    'info.simNote.0': 'Das farbige „Meer“ zeigt die vorzeichenbehaftete Polarität des Wellenfeldes (positiv und negativ).',
    'info.simNote.1':
      '„Hopping“ wird als periodische lokale Einschläge (Impulse) an Quellen modelliert, nicht als globales Sinus‑Umschalten.',

    'info.modelMath.title': 'Aktuelles Modell (exakte Implementierung)',
    'info.modelMath.subtitle':
      'Automatisch generierte Beschreibung der exakt laufenden Regeln (Conway + Mediumgleichungen) inklusive eingesetzter Einstellungswerte.',
    'info.modelMath.open': 'Formeln und Parameter anzeigen',
    'info.modelMath.warning':
      'Hinweis: dies ist eine technische Beschreibung der Simulation (keine physikalische Behauptung). Der optionale „numerische Amplituden‑Limiter“ ist ein Stabilitätswerkzeug und kann deaktiviert werden.',
    'info.modelMath.block.params': 'Parameter (aktuell)',
    'info.modelMath.block.conway': 'Conway‑Automat (exakte Regeln)',
    'info.modelMath.block.medium': 'Medium (exakter Schritt)',
    'info.modelMath.block.nucleation': 'Keimbildung aus Medium (exakter Algorithmus)',

    'helpButton.show': 'Erklärung anzeigen',
    'helpButton.hide': 'Erklärung ausblenden',

    'controls.title': 'Steuerung',
    'controls.prev.tooltip': 'Zurück (Schritt zurück)',
    'controls.prev.aria': 'Zurück',
    'controls.next.tooltip': 'Weiter (Schritt)',
    'controls.next.aria': 'Weiter',
    'controls.random.tooltip': 'Zufall',
    'controls.random.aria': 'Zufall',
    'controls.stop.tooltip': 'Stopp (löschen + Medium zurücksetzen)',
    'controls.stop.aria': 'Stopp',

    'simulation.title': 'Simulation',
    'simulation.speed': 'Evolutionsgeschwindigkeit (ms/Schritt): {{value}}',
    'simulation.speedHelp': 'Zeit zwischen Automaton‑Schritten. Niedriger = schnellere Evolution und schnellere Änderungen im Medium.',
    'simulation.density': 'Dichte (Zufall): {{value}}%',
    'simulation.densityHelp': 'Wie viele Zellen bei Zufall erzeugt werden. Höher = mehr Kollisionen und mehr Annihilationen.',

    'medium.title': 'Medium (Wellenfeld)',
    'medium.mode.label': 'Medium‑Modus',
    'medium.mode.help':
      'Aktiviert das Wellenmedium. Im Modus „Keimbildung“ kann das Medium bei Überschreiten der Schwelle neue Kerne (Materie/Antimaterie) erzeugen.',
    'medium.mode.placeholder': 'Auswählen',
    'medium.mode.off': 'Aus',
    'medium.mode.nucleation': 'Keimbildung aus dem Medium',

    'medium.hopHz.label': 'Einschlagsfrequenz: {{value}} Hz',
    'medium.hopHz.help':
      'Wie oft pro Sekunde Quellen (Zellen/Anti‑Zellen) einen impulsiven „Einschlag“ ins Medium geben. Höher = dichtere Wellen und häufigere Schwellereignisse.',

    'medium.hopStrength.label': 'Einschlagsstärke der Quelle: {{value}}%',
    'medium.hopStrength.help':
      'Impulsgröße beim Einschlag. Höher = größere Wellenamplituden um Quellen; beobachte Farbwechsel im „Meer“ und häufigere Keimbildung.',

    'medium.stepsPerGeneration.label': 'Medium‑Schritte pro Generation: {{value}}',
    'medium.stepsPerGeneration.help':
      'Wie viele Integrations-Substeps des Mediums pro Conway-Generation laufen. Höher = glattere/stabilere Evolution ohne die Gesamtzeit pro Generation zu ändern.',

    'medium.nucleationThreshold.label': 'Keimbildungsschwelle: {{value}}',
    'medium.nucleationThreshold.help':
      'Kritische (geglättete) Amplitude, ab der eine Fluktuation zu einem Kern stabilisiert. Niedriger = leichter Materie/Antimaterie; höher = seltener, stabiler.',

    'medium.antiparticles.label': 'Antiteilchen (entgegengesetzte Orientierung)',
    'medium.antiparticles.help':
      'Erlaubt der negativen Polarität, Anti‑Kerne (Antimaterie) zu bilden. Aus = nur positive Kerne.',

    'medium.tuning.title': 'Dynamik feinjustieren',
    'medium.annihilationEnergy.label': 'Annihilationsenergie: {{value}}%',
    'medium.annihilationEnergy.help':
      'Wie viel Energie bei einer Zelle+Anti‑Zelle‑Kollision als Impuls ins Medium zurückgeht. Höher = stärkere Wellen‑„Explosionen“ und mehr sekundäre Fluktuationen.',

    'medium.memoryRate.label': 'Medium‑Gedächtnis (Rate): {{value}}%',
    'medium.memoryRate.help':
      'Wie schnell sich lokales Gedächtnis an das aktuelle Feld anpasst. Höher = längere Nachhallzeiten und mehr „Historie“ im Verhalten.',

    'medium.memoryCoupling.label': 'Gedächtniskopplung: {{value}}',
    'medium.memoryCoupling.help':
      'Wie stark Gedächtnis auf die Dynamik zurückwirkt. Höher = ausgeprägtere Strukturen und Wellen‑„Führung“; zu hoch kann instabil machen.',

    'medium.nonlinearity.label': 'Medium‑Nichtlinearität: {{value}}',
    'medium.nonlinearity.help':
      'Nichtlineares Feedback, das das Verhalten bei größeren Amplituden verändert. Höher = schärfere Effekte und anderes Ausbreitungsverhalten; zu hoch kann große Wellen dämpfen.',

    'fluctuations.title': 'Medium‑Fluktuationen',
    'fluctuations.ambient.label': 'Umgebungsfluktuationen',
    'fluctuations.ambient.help':
      'Zufällige kleine Impulse ins Medium. Aktivieren, wenn Strukturen auch ohne Zeichnen „spontan“ entstehen sollen.',

    'fluctuations.intensity.label': 'Intensität: {{value}}%',
    'fluctuations.intensity.help': 'Stärke der Fluktuationen. Höher = mehr Störung im „Meer“ und mehr Schwellübergänge (Keimbildungen).',

    'fluctuations.size.label': 'Fluktuationsgröße (px): {{value}}',
    'fluctuations.size.help': 'Räumliche Ausdehnung. Kleiner = feines Korn; größer = größere „Blasen“ im Medium.',

    'fluctuations.shape.label': 'Fluktuationsform',
    'fluctuations.shape.help': 'Geometrie des lokalen Impulses (Kreis/Quadrat). Verändert die Wellenfront.',
    'fluctuations.shape.square': 'Quadrat',
    'fluctuations.shape.circle': 'Kreis',

    'grid.title': 'Gitter',
    'grid.size.label': 'Gittergröße (1:1): {{value}}',
    'grid.size.help': 'Setzt Zeilen und Spalten gemeinsam (quadratisches Gitter). Höher = mehr Detail, aber deutlich mehr Rechenaufwand und Speicher.',
    'grid.cellSize.label': 'Zellgröße (px): {{value}}',
    'grid.cellSize.help': 'Anzeigegröße (Zoom). Kleiner = mehr Zellen (schwerer); größer = besser lesbar.',
    'grid.wrap.label': 'Ränder verbinden (Torus)',
    'grid.wrap.help': 'An = Ränder sind verbunden (Torus). Aus = Rand ist Grenze; Wellen/Strukturen verhalten sich an Wänden anders.',
    'grid.showGrid.label': 'Gitter anzeigen',
    'grid.showGrid.help': 'Nur visuelle Hilfe. Ausschalten für eine sauberere Ansicht des Wellenfeldes.',

    'appearance.title': 'Aussehen',
    'appearance.theme.label': 'Farbschema',
    'appearance.theme.help': 'Ändert CSS‑Farbvariablen (Zellen, Gitter, Wellenpolarität). Beeinflusst nicht die Dynamik.',

    'theme.dark': 'Dunkel',
    'theme.light': 'Hell',
    'theme.matrix': 'Matrix',
    'theme.solarized': 'Solarized',
    'theme.neon': 'Neon',

    'hints.drawing': 'Zeichnen: Linksklick fügt hinzu, Rechtsklick löscht.',
    'hints.shortcuts': 'Shortcuts:',
    'hints.shortcut.playPause': 'Start/Pause',
    'hints.shortcut.step': 'Schritt',
    'hints.shortcut.random': 'Zufall',
    'hints.shortcut.stop': 'Stopp',
  },

  fr: {
    'meta.title': 'Milieu espace‑temps – Jeu de la vie',

    'common.choose': 'Choisir',
    'common.close': 'Fermer',

    'language.label': 'Langue',
    'language.en': 'English',
    'language.de': 'Deutsch',
    'language.fr': 'Français',
    'language.sk': 'Slovenčina',

    'start.title': 'Commencer la vie ?',
    'start.subtitle': 'Choisis un fragment.',
    'start.advanced': 'Démarrage avancé',
    'start.ariaStartPattern': 'Démarrer : {{name}}',
    'start.pattern.blinker': 'Blinker',
    'start.pattern.blinker.subtitle': '3 à la suite',
    'start.pattern.l3': 'L',
    'start.pattern.l3.subtitle': 'OO / .O',
    'start.pattern.doubleBlock': 'Double bloc',
    'start.pattern.doubleBlock.subtitle': 'OO / .OO',

    'start.pattern.blinkerPair': 'Blinker ±',
    'start.pattern.blinkerPair.subtitle': '3 + 3 (empilé)',
    'start.pattern.l3Pair': 'L ±',
    'start.pattern.l3Pair.subtitle': '3 + 3 (diagonal)',
    'start.pattern.doubleBlockPair': 'Double bloc ±',
    'start.pattern.doubleBlockPair.subtitle': '6 + 6 (blocs)',

    'repo.link': 'Dépôt GitHub',

    'app.openMenu': 'Ouvrir le menu',
    'app.closeMenu': 'Fermer le menu',
    'app.status.running': 'En cours',
    'app.status.paused': 'En pause',
    'app.play': 'Lecture',
    'app.pause': 'Pause',
    'app.generation': 'Génération',
    'app.medium': 'Milieu',
    'app.mediumAvgAmplitude': 'Amplitude moyenne du milieu',
    'app.mediumPreview.expand': 'Agrandir l’aperçu du milieu',
    'app.mediumPreview.tab.surface': 'Surface',
    'app.mediumPreview.tab.holographic': 'Holographique',
    'app.cellCounts': 'Nombre de cellules',
    'app.liveCellsTitle': 'Cellules vivantes (matière)',
    'app.antiCellsTitle': 'Anti‑cellules vivantes (antimatière)',

    'sidebar.title': 'Milieu espace‑temps',
    'sidebar.subtitle': 'Jeu de la vie + excitations (matière/antimatière)',
    'sidebar.quickStart.title': 'Démarrage rapide',

    'sidebar.info.tooltip': 'Fondement ontologique',
    'sidebar.info.button': 'Info',

    'info.modal.ariaLabel': 'Fondement ontologique',
    'info.modal.title': 'Fondement ontologique',
    'info.modal.subtitle': 'Résumé du cadre « milieu espace‑temps dynamique »',

    'info.intro':
      'Ce jeu est une simulation visuelle inspirée d’un cadre ontologique où la matière, les interactions et « l’espace‑temps » sont des modes émergents d’un même milieu dynamique. Ce n’est ni une preuve ni une prédiction physique ; c’est un outil pour explorer intuitivement les seuils, la mémoire et les excitations.',

    'info.postulate.title': 'Postulat du milieu',
    'info.postulate.0': 'Il existe un seul milieu fondamental : dynamique, continu, non linéaire et doté de mémoire.',
    'info.postulate.1': 'L’état global du milieu est primaire ; les états locaux en sont des projections.',
    'info.postulate.2': 'La séparabilité n’est qu’une approximation valable dans certains régimes.',

    'info.timeSpace.title': 'Temps, espace, excitations',
    'info.timeSpace.0': 'Le temps mesure le changement de l’état global ; l’espace est une structure relationnelle des degrés de liberté.',
    'info.timeSpace.1': 'Les « particules » ne sont pas des objets ajoutés : ce sont des modes stables du comportement du milieu (des processus).',
    'info.timeSpace.2a': 'Des fluctuations peuvent dépasser un seuil critique et se stabiliser (dans l’UI :',
    'info.timeSpace.2b': 'Seuil de nucléation',
    'info.timeSpace.2c': ').',

    'info.antimatter.title': 'Antimatière et annihilation',
    'info.antimatter.0':
      'Si des excitations portent un signe orienté/topologique, une antiparticule est le même mode avec une orientation opposée.',
    'info.antimatter.1':
      'L’annihilation est la disparition d’un mode stable et une reconfiguration du milieu : l’énergie retourne au champ.',
    'info.antimatter.2':
      'Dans cette simulation, cela apparaît comme une excitation impulsionnelle du milieu lors d’événements locaux.',

    'info.simNote.title': 'Note sur la simulation',
    'info.simNote.0': 'La « mer » colorée montre la polarité signée du champ d’ondes (composantes positive et négative).',
    'info.simNote.1':
      'Le « hopping » est modélisé par des impacts locaux périodiques (impulsions) liés aux sources, et non par un basculement sinusoïdal global.',

    'info.modelMath.title': 'Modèle actuel (implémentation exacte)',
    'info.modelMath.subtitle':
      'Description auto‑générée des règles réellement exécutées (Conway + équations du milieu), avec les valeurs actuelles des paramètres.',
    'info.modelMath.open': 'Afficher formules et paramètres',
    'info.modelMath.warning':
      'Note : ceci décrit la simulation (pas une affirmation physique). Le « limiteur numérique d’amplitude » est un outil de stabilité optionnel et peut être désactivé.',
    'info.modelMath.block.params': 'Paramètres (actuels)',
    'info.modelMath.block.conway': 'Automate de Conway (règles exactes)',
    'info.modelMath.block.medium': 'Milieu (étape exacte)',
    'info.modelMath.block.nucleation': 'Nucléation depuis le milieu (algorithme exact)',

    'helpButton.show': 'Afficher l’explication',
    'helpButton.hide': 'Masquer l’explication',

    'controls.title': 'Contrôles',
    'controls.prev.tooltip': 'Précédent (retour)',
    'controls.prev.aria': 'Précédent',
    'controls.next.tooltip': 'Suivant (pas)',
    'controls.next.aria': 'Suivant',
    'controls.random.tooltip': 'Aléatoire',
    'controls.random.aria': 'Aléatoire',
    'controls.stop.tooltip': 'Stop (effacer + réinitialiser le milieu)',
    'controls.stop.aria': 'Stop',

    'simulation.title': 'Simulation',
    'simulation.speed': 'Vitesse d’évolution (ms/pas) : {{value}}',
    'simulation.speedHelp': 'Temps entre les pas de l’automate. Plus bas = évolution plus rapide et changements plus rapides du milieu.',
    'simulation.density': 'Densité (Aléatoire) : {{value}}%',
    'simulation.densityHelp': 'Nombre de cellules créées par Aléatoire. Plus haut = plus de collisions et plus d’annihilations.',

    'medium.title': 'Milieu (champ d’ondes)',
    'medium.mode.label': 'Mode du milieu',
    'medium.mode.help':
      'Active le milieu ondulatoire. En mode « Nucléation », le milieu peut créer de nouveaux noyaux (matière/antimatière) quand le seuil est dépassé.',
    'medium.mode.placeholder': 'Choisir',
    'medium.mode.off': 'Désactivé',
    'medium.mode.nucleation': 'Nucléation depuis le milieu',

    'medium.hopHz.label': 'Fréquence des impacts : {{value}} Hz',
    'medium.hopHz.help':
      'À quelle fréquence (par seconde) les sources (cellules/anti‑cellules) produisent un « impact » impulsionnel dans le milieu. Plus haut = ondes plus denses et événements de seuil plus fréquents.',

    'medium.hopStrength.label': 'Force d’impact de la source : {{value}}%',
    'medium.hopStrength.help':
      'Taille de l’impulsion. Plus haut = plus grande amplitude des ondes autour des sources ; observe les changements de couleur de la « mer » et une nucléation plus fréquente.',

    'medium.stepsPerGeneration.label': 'Pas du milieu par génération : {{value}}',
    'medium.stepsPerGeneration.help':
      'Combien de sous-pas d’intégration du milieu s’exécutent par génération Conway. Plus haut = évolution plus lisse/stable sans changer le temps total du milieu par génération.',

    'medium.nucleationThreshold.label': 'Seuil de nucléation : {{value}}',
    'medium.nucleationThreshold.help':
      'Amplitude critique (lissée) à partir de laquelle une fluctuation se stabilise en noyau. Plus bas = matière/antimatière plus facile ; plus haut = nucléations plus rares et stables.',

    'medium.antiparticles.label': 'Anti‑particules (orientation opposée)',
    'medium.antiparticles.help':
      'Autorise la polarité négative du milieu à former des anti‑noyaux (antimatière). Désactivé = seulement les noyaux positifs.',

    'medium.tuning.title': 'Réglage de la dynamique',
    'medium.annihilationEnergy.label': 'Énergie d’annihilation : {{value}}%',
    'medium.annihilationEnergy.help':
      'Quantité d’énergie renvoyée au milieu (impulsion) lors d’une collision cellule+anti‑cellule. Plus haut = « explosions » d’ondes plus marquées et plus de fluctuations secondaires.',

    'medium.memoryRate.label': 'Mémoire du milieu (taux) : {{value}}%',
    'medium.memoryRate.help':
      'Vitesse à laquelle la mémoire locale s’adapte au champ courant. Plus haut = résonances plus longues et plus de « passé » dans le comportement du milieu.',

    'medium.memoryCoupling.label': 'Couplage de mémoire : {{value}}',
    'medium.memoryCoupling.help':
      'Force du rétro‑effet de la mémoire sur la dynamique. Plus haut = structures plus marquées et « guidage » des ondes ; trop haut peut déstabiliser.',

    'medium.nonlinearity.label': 'Non‑linéarité du milieu : {{value}}',
    'medium.nonlinearity.help':
      'Rétroaction non linéaire qui modifie le comportement à forte amplitude. Plus haut = phénomènes plus nets et propagation différente ; trop haut peut amortir les grandes ondes.',

    'fluctuations.title': 'Fluctuations du milieu',
    'fluctuations.ambient.label': 'Fluctuations ambiantes',
    'fluctuations.ambient.help':
      'Petites impulsions aléatoires dans le milieu. Active si tu veux une formation « spontanée » de structures même sans dessin.',

    'fluctuations.intensity.label': 'Intensité : {{value}}%',
    'fluctuations.intensity.help':
      'Force des fluctuations. Plus haut = plus de perturbations dans la « mer » et plus de transitions de seuil (nucléations).',

    'fluctuations.size.label': 'Taille de la fluctuation (px) : {{value}}',
    'fluctuations.size.help':
      'Étendue spatiale. Plus petit = grain fin ; plus grand = plus grosses « bulles » dans le milieu.',

    'fluctuations.shape.label': 'Forme de la fluctuation',
    'fluctuations.shape.help': 'Géométrie de l’impulsion locale (cercle/carré). Change le front d’onde.',
    'fluctuations.shape.square': 'Carré',
    'fluctuations.shape.circle': 'Cercle',

    'grid.title': 'Grille',
    'grid.size.label': 'Taille de la grille (1:1) : {{value}}',
    'grid.size.help':
      'Définit lignes et colonnes ensemble (grille carrée). Plus haut = plus de détail, mais beaucoup plus de calcul et de mémoire.',
    'grid.cellSize.label': 'Taille de cellule (px) : {{value}}',
    'grid.cellSize.help':
      'Échelle d’affichage (zoom). Plus petit = plus de cellules (plus coûteux) ; plus grand = plus lisible.',
    'grid.wrap.label': 'Boucler les bords (tore)',
    'grid.wrap.help':
      'Activé = les bords se rejoignent (tore). Désactivé = bord = frontière ; ondes/structures se comportent différemment près des murs.',
    'grid.showGrid.label': 'Afficher la grille',
    'grid.showGrid.help': 'Aide visuelle uniquement. Désactive pour une vue plus propre du champ d’ondes.',

    'appearance.title': 'Apparence',
    'appearance.theme.label': 'Schéma de couleurs',
    'appearance.theme.help':
      'Change les variables CSS de couleur (cellules, grille, polarité des ondes). N’affecte pas la dynamique.',

    'theme.dark': 'Sombre',
    'theme.light': 'Clair',
    'theme.matrix': 'Matrix',
    'theme.solarized': 'Solarized',
    'theme.neon': 'Néon',

    'hints.drawing': 'Dessin : clic gauche ajoute, clic droit efface.',
    'hints.shortcuts': 'Raccourcis :',
    'hints.shortcut.playPause': 'Lecture/Pause',
    'hints.shortcut.step': 'Pas',
    'hints.shortcut.random': 'Aléatoire',
    'hints.shortcut.stop': 'Stop',
  },
};
