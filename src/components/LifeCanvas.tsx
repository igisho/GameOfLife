import { type MutableRefObject, type MouseEvent, useCallback, useEffect, useRef } from 'react';
import type { ThemeName } from '../lib/themes';
import { readCssVar } from '../lib/themes';
import type { GameSettings, PaintMode } from '../game/types';

type Props = {
  settings: GameSettings;
  liveRef: MutableRefObject<Set<number>>;
  generation: number;
  drawNonce: number;
  theme: ThemeName;
  onPaintCell: (r: number, c: number, mode: PaintMode) => void;
};

function keyToRc(cols: number, key: number) {
  return [Math.floor(key / cols), key % cols] as const;
}

export default function LifeCanvas({ settings, liveRef, generation, drawNonce, theme, onPaintCell }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const paintingRef = useRef(false);
  const paintModeRef = useRef<PaintMode>('add');

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = settings.cols * settings.cellSize;
    canvas.height = settings.rows * settings.cellSize;
  }, [settings.cellSize, settings.cols, settings.rows]);

  const syncCanvasColors = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.fillStyle = readCssVar('--cell');
    ctx.strokeStyle = readCssVar('--grid');
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const k of liveRef.current) {
      const [r, c] = keyToRc(settings.cols, k);
      const x = c * settings.cellSize;
      const y = r * settings.cellSize;
      ctx.fillRect(x, y, settings.cellSize, settings.cellSize);
    }

    if (settings.showGrid) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1;

      for (let c = 0; c <= settings.cols; c++) {
        const x = c * settings.cellSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let r = 0; r <= settings.rows; r++) {
        const y = r * settings.cellSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [liveRef, settings.cellSize, settings.cols, settings.rows, settings.showGrid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctxRef.current = ctx;
    syncCanvasSize();
    syncCanvasColors();
    draw();
  }, [draw, syncCanvasColors, syncCanvasSize]);

  useEffect(() => {
    syncCanvasSize();
    draw();
  }, [settings.rows, settings.cols, settings.cellSize, syncCanvasSize, draw]);

  useEffect(() => {
    void theme;
    syncCanvasColors();
    draw();
  }, [theme, syncCanvasColors, draw]);

  useEffect(() => {
    void generation;
    void drawNonce;
    draw();
  }, [generation, drawNonce, draw]);

  useEffect(() => {
    const handleMouseUp = () => {
      paintingRef.current = false;
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const cellFromEvent = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return [0, 0] as const;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const c = Math.floor(x / settings.cellSize);
      const r = Math.floor(y / settings.cellSize);
      return [r, c] as const;
    },
    [settings.cellSize]
  );

  const onMouseDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      paintingRef.current = true;
      paintModeRef.current = e.button === 2 ? 'erase' : 'add';
      const [r, c] = cellFromEvent(e);
      onPaintCell(r, c, paintModeRef.current);
    },
    [cellFromEvent, onPaintCell]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (!paintingRef.current) return;
      const [r, c] = cellFromEvent(e);
      onPaintCell(r, c, paintModeRef.current);
    },
    [cellFromEvent, onPaintCell]
  );

  return (
    <canvas
      ref={canvasRef}
      className="block bg-[var(--canvas)]"
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
    />
  );
}
