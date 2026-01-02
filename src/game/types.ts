export type BlobShape = 'square' | 'circle';
export type PaintMode = 'add' | 'erase';

export type MediumMode = 'off' | 'nucleation';

export type GameSettings = {
  rows: number;
  cols: number;
  cellSize: number;
  wrap: boolean;
  showGrid: boolean;
  speedMs: number;
  density: number; // 0..1

  // Medium / wave layer
  mediumMode: MediumMode;
  // How many medium integration substeps to run per Conway generation.
  // If >1, the total medium time per generation stays constant (smaller dt per substep).
  mediumStepsPerGeneration: number;
  hopHz: number;
  hopStrength: number;
  nucleationThreshold: number;

  // Experimental: spawn antiparticles from negative waves.
  antiparticlesEnabled: boolean;

  // Medium tuning (experimental)
  mediumMemoryRate: number; // 0..1
  mediumMemoryCoupling: number;
  mediumNonlinearity: number;

  // Numerical stability (not physical): soft amplitude limiter.
  // 0 = off (closest to theory), otherwise controls compression scale.
  mediumAmplitudeLimiter: number;

  // Annihilation -> energy injection
  annihilationBurst: number; // 0..1

  // Ambient noise injected into the wave medium (background lake agitation).
  lakeNoiseEnabled: boolean;
  lakeNoiseIntensity: number; // 0..1
  lakeBlobSize: number;
  lakeBlobShape: BlobShape;
};
