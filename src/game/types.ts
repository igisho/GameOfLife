export type BlobShape = 'square' | 'circle';
export type PaintMode = 'add' | 'erase';

export type GameSettings = {
  rows: number;
  cols: number;
  cellSize: number;
  wrap: boolean;
  showGrid: boolean;
  speedMs: number;
  density: number; // 0..1
  noiseEnabled: boolean;
  noiseIntensity: number; // 0..1
  blobSize: number;
  blobShape: BlobShape;
};
