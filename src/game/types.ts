export type BlobShape = 'square' | 'circle';
export type PaintMode = 'add' | 'erase';

export type MediumMode = 'off' | 'visual' | 'nucleation';

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

  // Noise injected into the cell grid each tick (keeps the automaton alive).
  noiseEnabled: boolean;
  noiseIntensity: number; // 0..1
  blobSize: number;
  blobShape: BlobShape;

  // Ambient noise injected into the wave medium (background lake agitation).
  lakeNoiseEnabled: boolean;
  lakeNoiseIntensity: number; // 0..1
  lakeBlobSize: number;
  lakeBlobShape: BlobShape;
};
