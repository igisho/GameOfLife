import { useEffect, useMemo, useRef, useState } from 'react';
import { readCssVar } from '../lib/themes';
import type { MediumPreviewFrame } from './LifeCanvas';

type Rgb = { r: number; g: number; b: number };

type Vec3 = { x: number; y: number; z: number };

type Mat4 = Float32Array;

type Props = {
  frame: MediumPreviewFrame | null;
  enabled: boolean;
  className?: string;
  /**
   * `canvas2d` = current lightweight isometric quads renderer.
   * `webgl` = true 3D mesh (intended for the expanded modal only).
   */
  renderer?: 'canvas2d' | 'webgl';
};

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

function mat4Identity(): Mat4 {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function mat4Mul(a: Mat4, b: Mat4): Mat4 {
  // Column-major out = a * b
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[0 * 4 + r]! * b[c * 4 + 0]! +
        a[1 * 4 + r]! * b[c * 4 + 1]! +
        a[2 * 4 + r]! * b[c * 4 + 2]! +
        a[3 * 4 + r]! * b[c * 4 + 3]!;
    }
  }
  return out;
}

function mat4Perspective(fovyRad: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1.0 / Math.tan(fovyRad / 2);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

function mat4LookAt(eye: Vec3, center: Vec3, up: Vec3): Mat4 {
  const zx = eye.x - center.x;
  const zy = eye.y - center.y;
  const zz = eye.z - center.z;
  const z = normalize3(zx, zy, zz);

  // x = up × z
  const xx = up.y * z.z - up.z * z.y;
  const xy = up.z * z.x - up.x * z.z;
  const xz = up.x * z.y - up.y * z.x;
  const x = normalize3(xx, xy, xz);

  // y = z × x
  const yx = z.y * x.z - z.z * x.y;
  const yy = z.z * x.x - z.x * x.z;
  const yz = z.x * x.y - z.y * x.x;

  const out = mat4Identity();
  out[0] = x.x;
  out[4] = x.y;
  out[8] = x.z;

  out[1] = yx;
  out[5] = yy;
  out[9] = yz;

  out[2] = z.x;
  out[6] = z.y;
  out[10] = z.z;

  out[12] = -(x.x * eye.x + x.y * eye.y + x.z * eye.z);
  out[13] = -(yx * eye.x + yy * eye.y + yz * eye.z);
  out[14] = -(z.x * eye.x + z.y * eye.y + z.z * eye.z);
  return out;
}

function sampleBilinear(values: Float32Array, w: number, h: number, x: number, y: number) {
  const x0 = clamp(Math.floor(x), 0, w - 1);
  const y0 = clamp(Math.floor(y), 0, h - 1);
  const x1 = clamp(x0 + 1, 0, w - 1);
  const y1 = clamp(y0 + 1, 0, h - 1);
  const tx = x - x0;
  const ty = y - y0;

  const a = values[y0 * w + x0] ?? 0;
  const b = values[y0 * w + x1] ?? 0;
  const c = values[y1 * w + x0] ?? 0;
  const d = values[y1 * w + x1] ?? 0;

  const ab = a + (b - a) * tx;
  const cd = c + (d - c) * tx;
  return ab + (cd - ab) * ty;
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function rgbToVec3(c: Rgb): [number, number, number] {
  return [c.r / 255, c.g / 255, c.b / 255];
}

type WebGLState = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  vbo: WebGLBuffer;
  ibo: WebGLBuffer;
  seg: number;
  indexCount: number;
  aPos: number;
  aNormal: number;
  aU: number;
  uMvp: WebGLUniformLocation;
  uModel: WebGLUniformLocation;
  uLight: WebGLUniformLocation;
  uPosColor: WebGLUniformLocation;
  uNegColor: WebGLUniformLocation;
  uZeroColor: WebGLUniformLocation;
  uURef: WebGLUniformLocation;
  uFogColor: WebGLUniformLocation;
};

const VS_SOURCE = `
attribute vec3 aPos;
attribute vec3 aNormal;
attribute float aU;

uniform mat4 uMvp;
uniform mat4 uModel;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vU;

void main() {
  vec4 world = uModel * vec4(aPos, 1.0);
  vWorldPos = world.xyz;
  vNormal = (uModel * vec4(aNormal, 0.0)).xyz;
  vU = aU;
  gl_Position = uMvp * vec4(aPos, 1.0);
}
`;

const FS_SOURCE = `
precision mediump float;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vU;

uniform vec3 uLight;
uniform vec3 uPosColor;
uniform vec3 uNegColor;
uniform vec3 uZeroColor;
uniform float uURef;
uniform vec3 uFogColor;

float saturate(float x) { return clamp(x, 0.0, 1.0); }

void main() {
  vec3 n = normalize(vNormal);
  // Render both sides similarly; avoid "holes" from backface culling.
  float diffuse = saturate(abs(dot(n, uLight)));

  float zRef = max(0.03, uURef);
  // Smooth compression (avoid hard plateaus at high |u|).
  float mag = 1.0 - exp(-abs(vU) / (zRef * 1.3));
  mag = saturate(mag);
  float mixT = 0.22 + 0.78 * pow(mag, 0.85);

  vec3 base = vU >= 0.0 ? uPosColor : uNegColor;
  vec3 tinted = mix(uZeroColor, base, mixT);

  float shade = 0.55 + 0.45 * diffuse;
  vec3 shaded = tinted * shade;

  // Subtle depth fog (farther = more fog).
  float fog = saturate((vWorldPos.y + 1.2) * 0.22);
  vec3 fogged = mix(shaded, uFogColor, fog * 0.22);

  gl_FragColor = vec4(fogged, 1.0);
}
`;

export default function MediumLake3DPreview({ frame, enabled, className, renderer = 'canvas2d' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webglRef = useRef<WebGLState | null>(null);
  const [resizeNonce, setResizeNonce] = useState(0);
  const [webglSupported, setWebglSupported] = useState(true);

  const rendererEffective = renderer === 'webgl' && webglSupported ? 'webgl' : 'canvas2d';

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

  // WebGL init/cleanup.
  useEffect(() => {
    if (rendererEffective !== 'webgl') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (webglRef.current) return;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: true, stencil: false });
    if (!gl) {
      setWebglSupported(false);
      return;
    }

    const program = createProgram(gl, VS_SOURCE, FS_SOURCE);
    if (!program) {
      // This is extremely unlikely if WebGL exists; keep WebGL mode but avoid crashing.
      return;
    }

    const vbo = gl.createBuffer();
    const ibo = gl.createBuffer();
    if (!vbo || !ibo) {
      gl.deleteProgram(program);
      return;
    }

    const aPos = gl.getAttribLocation(program, 'aPos');
    const aNormal = gl.getAttribLocation(program, 'aNormal');
    const aU = gl.getAttribLocation(program, 'aU');

    const uMvp = gl.getUniformLocation(program, 'uMvp');
    const uModel = gl.getUniformLocation(program, 'uModel');
    const uLight = gl.getUniformLocation(program, 'uLight');
    const uPosColor = gl.getUniformLocation(program, 'uPosColor');
    const uNegColor = gl.getUniformLocation(program, 'uNegColor');
    const uZeroColor = gl.getUniformLocation(program, 'uZeroColor');
    const uURef = gl.getUniformLocation(program, 'uURef');
    const uFogColor = gl.getUniformLocation(program, 'uFogColor');

    if (!uMvp || !uModel || !uLight || !uPosColor || !uNegColor || !uZeroColor || !uURef || !uFogColor) {
      gl.deleteBuffer(vbo);
      gl.deleteBuffer(ibo);
      gl.deleteProgram(program);
      return;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    webglRef.current = {
      gl,
      program,
      vbo,
      ibo,
      seg: 0,
      indexCount: 0,
      aPos,
      aNormal,
      aU,
      uMvp,
      uModel,
      uLight,
      uPosColor,
      uNegColor,
      uZeroColor,
      uURef,
      uFogColor,
    };

    return () => {
      const state = webglRef.current;
      if (!state) return;
      if (state.program) state.gl.deleteProgram(state.program);
      if (state.vbo) state.gl.deleteBuffer(state.vbo);
      if (state.ibo) state.gl.deleteBuffer(state.ibo);
      webglRef.current = null;
    };
  }, [rendererEffective]);

  // WebGL render.
  useEffect(() => {
    if (rendererEffective !== 'webgl') return;

    const canvas = canvasRef.current;
    const state = webglRef.current;
    if (!canvas || !state) return;

    const gl = state.gl;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    gl.viewport(0, 0, w, h);

    const fieldRgb = parseCssColor(colors.field);
    gl.clearColor(fieldRgb.r / 255, fieldRgb.g / 255, fieldRgb.b / 255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (!enabled || !frame) return;

    const gridW = frame.w;
    const gridH = frame.h;
    const values = frame.data;
    if (gridW < 2 || gridH < 2 || values.length < gridW * gridH) return;

    const zRef = Math.max(0.03, frame.uRef);
    // Object-space height scaling (independent of pixel resolution).
    // `uRef` should map to a modest visible height so the whole surface stays in frame.
    const zScale = 0.18 / zRef;

    const minSideCss = Math.min(rect.width, rect.height);
    const seg = clamp(Math.round(minSideCss * 0.35), 110, 220);

    if (seg !== state.seg) {
      const indexCount = seg * seg * 6;
      const indices = new Uint16Array(indexCount);
      let p = 0;
      const stride = seg + 1;

      for (let y = 0; y < seg; y++) {
        for (let x = 0; x < seg; x++) {
          const i0 = y * stride + x;
          const i1 = i0 + 1;
          const i2 = i0 + stride;
          const i3 = i2 + 1;

          // CCW winding for front faces.
          indices[p++] = i0;
          indices[p++] = i1;
          indices[p++] = i2;

          indices[p++] = i1;
          indices[p++] = i3;
          indices[p++] = i2;
        }
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      state.seg = seg;
      state.indexCount = indexCount;
    }

    const vertexStrideFloats = 7; // pos(3) + normal(3) + u(1)
    const vertexCount = (seg + 1) * (seg + 1);
    const verts = new Float32Array(vertexCount * vertexStrideFloats);

    // Screen composition tweak: lift the whole surface slightly toward the center.
    const zOffset = 0.12;

    const uStepX = (gridW - 1) / seg;
    const uStepY = (gridH - 1) / seg;

    let o = 0;
    for (let y = 0; y <= seg; y++) {
      const ty = y / seg;
      const uY = ty * (gridH - 1);
      const yObj = ty * 2 - 1;

      for (let x = 0; x <= seg; x++) {
        const tx = x / seg;
        const uX = tx * (gridW - 1);
        const xObj = tx * 2 - 1;

        const u = sampleBilinear(values, gridW, gridH, uX, uY);
        const z = u * zScale;

        const zL = sampleBilinear(values, gridW, gridH, uX - uStepX, uY) * zScale;
        const zR = sampleBilinear(values, gridW, gridH, uX + uStepX, uY) * zScale;
        const zD = sampleBilinear(values, gridW, gridH, uX, uY - uStepY) * zScale;
        const zU = sampleBilinear(values, gridW, gridH, uX, uY + uStepY) * zScale;

        // xObj / yObj step between neighbor vertices is 2/seg.
        const dzdx = (zR - zL) * (seg / 4);
        const dzdy = (zU - zD) * (seg / 4);
        // y axis is flipped in object space (see below), so keep that in mind.
        const nGrid = normalize3(-dzdx, dzdy, 4);

        // Grid-aligned orientation (trapezoid perspective):
        // x increases to the right; y increases downward on the grid,
        // but the camera looks "from the bottom" so we flip y in object space.
        const xPos = xObj;
        const yPos = -yObj;

        verts[o++] = xPos;
        verts[o++] = yPos;
        verts[o++] = z + zOffset;

        verts[o++] = nGrid.x;
        verts[o++] = nGrid.y;
        verts[o++] = nGrid.z;

        verts[o++] = u;
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, state.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);

    gl.useProgram(state.program);

    const strideBytes = vertexStrideFloats * 4;
    gl.enableVertexAttribArray(state.aPos);
    gl.vertexAttribPointer(state.aPos, 3, gl.FLOAT, false, strideBytes, 0);

    gl.enableVertexAttribArray(state.aNormal);
    gl.vertexAttribPointer(state.aNormal, 3, gl.FLOAT, false, strideBytes, 3 * 4);

    gl.enableVertexAttribArray(state.aU);
    gl.vertexAttribPointer(state.aU, 1, gl.FLOAT, false, strideBytes, 6 * 4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.ibo);

    const aspect = w / h;
    const proj = mat4Perspective((42 * Math.PI) / 180, aspect, 0.1, 30);
    // Trapezoid perspective aligned with the grid: camera sits "below" the grid
    // and looks toward its center so the bottom row stays at the bottom.
    const view = mat4LookAt({ x: 0, y: -2.6, z: 1.35 }, { x: 0, y: 0.25, z: 0.1 }, { x: 0, y: 0, z: 1 });
    const model = mat4Identity();
    const mvp = mat4Mul(proj, mat4Mul(view, model));

    gl.uniformMatrix4fv(state.uMvp, false, mvp);
    gl.uniformMatrix4fv(state.uModel, false, model);

    const light = normalize3(-0.7, -1.0, 1.2);
    gl.uniform3f(state.uLight, light.x, light.y, light.z);

    const pos = rgbToVec3(colors.pos);
    const neg = rgbToVec3(colors.neg);
    const zero = rgbToVec3(colors.zero);
    gl.uniform3f(state.uPosColor, pos[0], pos[1], pos[2]);
    gl.uniform3f(state.uNegColor, neg[0], neg[1], neg[2]);
    gl.uniform3f(state.uZeroColor, zero[0], zero[1], zero[2]);
    gl.uniform1f(state.uURef, frame.uRef);
    gl.uniform3f(state.uFogColor, zero[0], zero[1], zero[2]);

    gl.drawElements(gl.TRIANGLES, state.indexCount, gl.UNSIGNED_SHORT, 0);
  }, [colors, enabled, frame, rendererEffective, resizeNonce]);

  // 2D canvas renderer (used for small HUD preview + fallback).
  useEffect(() => {
    if (rendererEffective !== 'canvas2d') return;

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

    // Trapezoid perspective: far rows are narrower, near rows wider.
    const farScale = 0.58;
    const nearScale = 1;

    const maxWidthUnits = Math.max(1, (gridW - 1) * nearScale);
    const cell = Math.max(1, (w - 2 * pad) / maxWidthUnits);

    const yStep = Math.min(cell * 0.78, (h - 2 * pad) / Math.max(1, gridH - 1));
    const usableH = (gridH - 1) * yStep;

    const originX = w / 2;
    const originY = pad + (h - 2 * pad - usableH) / 2;

    const zRef = Math.max(0.03, frame.uRef);
    const heightGain = 0.5;
    const zScale = ((h * 0.16) / zRef) * heightGain;

    const light = normalize3(-0.7, -1.0, 1.2);

    const project = (x: number, y: number, z: number) => {
      const t = (gridH - 1) > 0 ? y / (gridH - 1) : 0;
      const scale = farScale + (nearScale - farScale) * t;
      const sx = (x - (gridW - 1) / 2) * cell * scale + originX;
      const sy = originY + y * yStep - z;
      return { x: sx, y: sy };
    };

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let y = 0; y < gridH - 1; y++) {
      for (let x = 0; x < gridW - 1; x++) {

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
        const mag = clamp(1 - Math.exp(-abs / (zRef * 1.3)), 0, 1);

        const base = uAvg >= 0 ? colors.pos : colors.neg;
        const tinted = lerpRgb(colors.zero, base, 0.22 + 0.78 * Math.pow(mag, 0.85));

        const tDepth = (gridH - 2) > 0 ? y / (gridH - 2) : 1;
        const depthFog = clamp(1 - tDepth, 0, 1);
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

        // Keep a faint grid for readability in the tiny preview.
        ctx.strokeStyle = colors.grid;
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = Math.max(1, Math.round(1 * dpr));
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }, [colors, enabled, frame, rendererEffective, resizeNonce]);

  return <canvas ref={canvasRef} className={className} role="img" aria-label="Medium 3D preview" />;
}
