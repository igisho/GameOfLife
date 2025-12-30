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
  hopHz: number;
  hopStrength: number;
  nucleationThreshold: number;

  // Experimental: spawn antiparticles from negative waves.
  antiparticlesEnabled: boolean;

  // Medium tuning (experimental)
  mediumMemoryRate: number; // 0..1
  mediumMemoryCoupling: number;
  mediumNonlinearity: number;

  // Annihilation -> energy injection
  annihilationBurst: number; // 0..1

  // Ambient noise injected into the wave medium (background lake agitation).
  lakeNoiseEnabled: boolean;
  lakeNoiseIntensity: number; // 0..1
  lakeBlobSize: number;
  lakeBlobShape: BlobShape;
};
