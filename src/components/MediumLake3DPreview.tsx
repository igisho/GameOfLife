import { useEffect, useMemo, useRef, useState } from 'react';
import { readCssVar } from '../lib/themes';
import type { MediumPreviewFrame } from './LifeCanvas';

type Rgb = { r: number; g: number; b: number };

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

function parseCssColor(input: string): Rgb {
  const s = input.trim();
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
  }

  const rgbMatch = s.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const parts = rgbMatch[1]
      .split(',')
      .map((p) => p.trim())
      .map((p) => Number(p));
    const r = clamp(parts[0] ?? 0, 0, 255);
    const g = clamp(parts[1] ?? 0, 0, 255);
    const b = clamp(parts[2] ?? 0, 0, 255);
    return { r, g, b };
  }

  return { r: 255, g: 255, b: 255 };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return { r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) };
}

function toCss({ r, g, b }: Rgb, alpha = 1) {
  const rr = clamp(Math.round(r), 0, 255);
  const gg = clamp(Math.round(g), 0, 255);
  const bb = clamp(Math.round(b), 0, 255);
  return `rgba(${rr},${gg},${bb},${clamp(alpha, 0, 1)})`;
}

function normalize3(x: number, y: number, z: number) {
  const len = Math.hypot(x, y, z);
  if (len < 1e-9) return { x: 0, y: 0, z: 1 };
  return { x: x / len, y: y / len, z: z / len };
}

type Props = {
  frame: MediumPreviewFrame | null;
  enabled: boolean;
  className?: string;
};

export default function MediumLake3DPreview({ frame, enabled, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [resizeNonce, setResizeNonce] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(() => setResizeNonce((n) => n + 1));
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const colors = useMemo(() => {
    return {
      field: readCssVar('--field') || '#000',
      text: readCssVar('--text') || '#fff',
      grid: readCssVar('--grid') || 'rgba(255,255,255,0.25)',
      pos: parseCssColor(readCssVar('--wave-pos') || '#7c9cff'),
      neg: parseCssColor(readCssVar('--wave-neg') || '#ff4fd8'),
      zero: parseCssColor(readCssVar('--canvas') || '#000'),
    };
  }, [resizeNonce]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = colors.field;
    ctx.fillRect(0, 0, w, h);

    if (!enabled || !frame) return;

    const gridW = frame.w;
    const gridH = frame.h;
    const values = frame.data;

    if (gridW < 2 || gridH < 2 || values.length < gridW * gridH) return;

    const pad = 6 * dpr;
    const span = gridW + gridH;

    const cell = Math.max(
      1,
      Math.min((w - 2 * pad) / span, (h - 2 * pad) / (span * 0.62))
    );

    const maxDepth = gridW + gridH - 2;

    const originX = w / 2;
    // Shift the origin up so the full (x+y) span fits.
    const originY = clamp(h - pad - maxDepth * cell * 0.52, pad, h - pad);

    const zRef = Math.max(0.03, frame.uRef);
    const heightGain = 0.5;
    const zScale = ((h * 0.18) / zRef) * heightGain;

    const light = normalize3(1, -1, 1.2);

    const project = (x: number, y: number, z: number) => {
      const sx = (x - y) * cell + originX;
      const sy = (x + y) * cell * 0.52 + originY - z;
      return { x: sx, y: sy };
    };

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let depth = 0; depth <= maxDepth; depth++) {
      for (let y = 0; y < gridH - 1; y++) {
        const x = depth - y;
        if (x < 0 || x >= gridW - 1) continue;

        const i00 = y * gridW + x;
        const i10 = y * gridW + (x + 1);
        const i01 = (y + 1) * gridW + x;
        const i11 = (y + 1) * gridW + (x + 1);

        const u00 = Number.isFinite(values[i00]) ? (values[i00] as number) : 0;
        const u10 = Number.isFinite(values[i10]) ? (values[i10] as number) : 0;
        const u01 = Number.isFinite(values[i01]) ? (values[i01] as number) : 0;
        const u11 = Number.isFinite(values[i11]) ? (values[i11] as number) : 0;

        const z00 = u00 * zScale;
        const z10 = u10 * zScale;
        const z01 = u01 * zScale;
        const z11 = u11 * zScale;

        const p00 = project(x, y, z00);
        const p10 = project(x + 1, y, z10);
        const p11 = project(x + 1, y + 1, z11);
        const p01 = project(x, y + 1, z01);

        const dzdx = (u10 - u00 + u11 - u01) * 0.5;
        const dzdy = (u01 - u00 + u11 - u10) * 0.5;

        const n = normalize3(-dzdx, -dzdy, 1.8);
        const diffuse = clamp(n.x * light.x + n.y * light.y + n.z * light.z, 0, 1);

        const uAvg = (u00 + u10 + u01 + u11) * 0.25;
        const abs = Math.abs(uAvg);
        const mag = clamp(abs / (zRef * 1.3), 0, 1);

        const base = uAvg >= 0 ? colors.pos : colors.neg;
        const tinted = lerpRgb(colors.zero, base, 0.22 + 0.78 * Math.pow(mag, 0.85));

        const depthFog = clamp(depth / maxDepth, 0, 1);
        const fogged = lerpRgb(tinted, colors.zero, depthFog * 0.22);

        const shade = 0.55 + 0.45 * diffuse;
        const shaded: Rgb = { r: fogged.r * shade, g: fogged.g * shade, b: fogged.b * shade };

        ctx.beginPath();
        ctx.moveTo(p00.x, p00.y);
        ctx.lineTo(p10.x, p10.y);
        ctx.lineTo(p11.x, p11.y);
        ctx.lineTo(p01.x, p01.y);
        ctx.closePath();

        ctx.fillStyle = toCss(shaded, 0.98);
        ctx.fill();

        ctx.strokeStyle = colors.grid;
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = Math.max(1, Math.round(1 * dpr));
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }, [colors, enabled, frame, resizeNonce]);

  return <canvas ref={canvasRef} className={className} role="img" aria-label="Medium 3D preview" />;
}
