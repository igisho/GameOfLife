import { useEffect, useMemo, useRef, useState } from 'react';

import { readCssVar } from '../lib/themes';
import { cn } from '../lib/cn';
import Button from './ui/Button';
import { useI18n } from '../i18n/I18nProvider';
import type { MediumPreviewFrame } from './LifeCanvas';

type Tuning = {
  steps: number;
  gridN: number;
  thr: number;
  gamma: number;
  k: number;
  phaseGain: number;
  exposureBoost: number;
  feedbackStable: number;
  feedbackTurb: number;
  deltaGain: number;
  sphereR: number;
  sphereFade: number;
};

type Props = {
  frame: MediumPreviewFrame | null;
  enabled: boolean;
  className?: string;
  /**
   * `webgl` is the intended mode.
   * `canvas2d` is a lightweight fallback.
   */
  renderer?: 'canvas2d' | 'webgl';

  // Settings are managed by Sidebar; this component only renders.
  viewMode: 0 | 1 | 2 | 3 | 4;
  tuning: Tuning;

  // Increment to trigger a copy-debug snapshot from outside (Sidebar button).
  copyDebugNonce?: number;
};

type Rgb = { r: number; g: number; b: number };

type Orbit = { yaw: number; pitch: number; zoom: number };

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

  return { r: 0, g: 0, b: 0 };
}

function rgbToVec3(c: Rgb): [number, number, number] {
  return [c.r / 255, c.g / 255, c.b / 255];
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    // eslint-disable-next-line no-console
    console.error('[Holographic] shader compile failed', log);
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
    const log = gl.getProgramInfoLog(program);
    // eslint-disable-next-line no-console
    console.error('[Holographic] program link failed', log);
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function createTexture(gl: WebGLRenderingContext) {
  const tex = gl.createTexture();
  if (!tex) return null;

  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return tex;
}

function setupLinearTexture(gl: WebGLRenderingContext) {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function setupNearestTexture(gl: WebGLRenderingContext) {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function createFramebuffer(gl: WebGLRenderingContext) {
  const fbo = gl.createFramebuffer();
  return fbo;
}


const VS_SOURCE = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// Pass 1: Monte Carlo hologram sample + temporal accumulation (ping-pong).
// - Each frame computes a noisy estimate and blends into an accumulation buffer.
// - Feedback < 1 introduces inertia/ghosting.
const FS_ACCUM = `
precision mediump float;

varying vec2 vUv;

uniform sampler2D uPrev;
uniform sampler2D uField;
uniform sampler2D uSource;
uniform sampler2D uDelta;

uniform float uFieldNorm;
uniform float uURef;

uniform float uTime;
uniform float uAspect;
uniform float uYaw;
uniform float uPitch;
uniform float uZoom;

uniform float uK;
uniform float uPhaseGain;
uniform float uThr;
uniform float uGammaBase;
uniform float uSphereR;
uniform float uSphereFade;
uniform float uExposureBoost;
uniform float uGridN;
uniform float uSteps;

uniform vec3 uBg;
uniform vec3 uMatter;
uniform vec3 uAnti;

uniform float uSeed;
uniform float uFeedbackStable;
uniform float uFeedbackTurb;
uniform float uDeltaGain;
uniform float uExposure;

float saturate(float x) { return clamp(x, 0.0, 1.0); }

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  float n = hash12(p);
  return vec2(n, hash12(p + n + 17.0));
}

float sampleField(vec2 uv) {
  float v = texture2D(uField, uv).r;
  return (v - 0.5) * uFieldNorm;
}

float sampleSource(vec2 uv) {
  // Decode UNORM source texture written as: 0 -> -1, 128 -> 0, 255 -> +1.
  // This avoids the "0.5 is not exactly representable" issue.
  float v = texture2D(uSource, uv).r;
  float s = (v * 255.0 - 128.0) / 127.0;
  return clamp(s, -1.0, 1.0);
}

float sampleDelta(vec2 uv) {
  // Delta is stored in [0..1], higher means more turbulent/change.
  return texture2D(uDelta, uv).r;
}

vec3 rotX(vec3 p, float a) {
  float s = sin(a);
  float c = cos(a);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

vec3 rotZ(vec3 p, float a) {
  float s = sin(a);
  float c = cos(a);
  return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
}

// Returns one Monte Carlo estimate of the global wave sum at point P.
// We do N stratified samples across the whole boundary plane.
float globalWaveSum(vec3 P, float time, float k, float phaseGain) {
  // N = 8 by default (8x8). uGridN allows tuning.
  int N = int(clamp(uGridN, 4.0, 16.0));


  float sum = 0.0;

  // Randomize the stratification with a per-pixel seed.
  vec2 j = hash22(gl_FragCoord.xy + uSeed);

  // WebGL1 loops need compile-time bounds; cap at 16 and early-continue.
  for (int iy = 0; iy < 16; iy++) {
    if (iy >= N) continue;
    for (int ix = 0; ix < 16; ix++) {
      if (ix >= N) continue;
      vec2 cell = vec2(float(ix), float(iy));
      vec2 uv = (cell + j) / float(N);

      float src = sampleSource(uv);
      if (src == 0.0) continue;

      float field = sampleField(uv);
      float amp = abs(field);

      // Boundary point on y=0 plane, mapped into volume coordinates.
      // R controls projection footprint.
      float R = 2.1;
      vec3 B = vec3((uv.x * 2.0 - 1.0) * R, 0.0, (uv.y * 2.0 - 1.0) * R);

      vec3 dV = P - B;
      float d = length(dV);
      d = max(d, 0.06);

      // Wave kernel: global propagation with 1/d attenuation.
      // Use a plain sinusoid + 1/d; temporal accumulation provides speckle detail.
      float phase = time + phaseGain * field;
      float wave = sin(k * d - phase) / d;

      // Amplitude weight from medium energy.
      float zRef = max(0.03, uURef);
      float a = 0.25 + 0.75 * (1.0 - exp(-amp / (zRef * 1.15)));

      sum += src * a * wave;
    }
  }

  // Normalize by sample count so exposure is stable.
  sum /= float(N * N);
  return sum;
}

vec3 palette(float signVal, float density) {
  // B: white core emerges from high constructive interference.
  vec3 base = signVal <= 0.0 ? uMatter : uAnti;
  float whiteT = saturate(pow(density, 0.55));
  return mix(base, vec3(1.0), whiteT * 0.85);
}

void main() {
  // Build camera ray.
  float zoom = clamp(uZoom, 0.65, 2.2);
  vec2 ndc = vec2((vUv.x * 2.0 - 1.0) * uAspect, vUv.y * 2.0 - 1.0);

  vec3 ro = vec3(0.0, -1.10 * zoom, 0.55 * zoom);
  vec3 rd = normalize(vec3(ndc.x, 1.18, ndc.y));

  ro = rotX(ro, uPitch);
  ro = rotZ(ro, uYaw);
  rd = rotX(rd, uPitch);
  rd = rotZ(rd, uYaw);

  // March only above the plane.
  float Ymax = 1.45;
  float tEnter = 0.0;
  float tExit = 5.0;

  if (abs(rd.y) < 1e-4) {
    if (ro.y < 0.0 || ro.y > Ymax) {
      gl_FragColor = vec4(texture2D(uPrev, vUv).rgb, 1.0);
      return;
    }
  } else {
    float t0 = (0.0 - ro.y) / rd.y;
    float t1 = (Ymax - ro.y) / rd.y;
    float a0 = min(t0, t1);
    float a1 = max(t0, t1);
    tEnter = max(tEnter, a0);
    tExit = min(tExit, a1);
    if (tExit <= tEnter) {
      gl_FragColor = vec4(texture2D(uPrev, vUv).rgb, 1.0);
      return;
    }
  }

  // Spherical falloff for the hologram volume.
  float sphereR = uSphereR;
  float sphereFade = uSphereFade;

  // Monte Carlo over depth: runtime-controlled step count.
  // WebGL1 needs a compile-time loop bound, so we use MAX_STEPS and skip past uSteps.
  const int MAX_STEPS = 32;
  int steps = int(clamp(uSteps, 6.0, float(MAX_STEPS)));

  float accumA = 0.0;
  vec3 accumC = vec3(0.0);

  float k = uK;
  float phaseGain = uPhaseGain;

  // Per-frame jitter in depth sampling (reduces banding).
  float jitter = hash12(gl_FragCoord.xy + uSeed * 13.7);

  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= steps) continue;
    float denom = max(1.0, float(steps - 1));
    float ft = (float(i) + jitter) / denom;
    float tt = mix(tEnter, tExit, ft);
    vec3 p = ro + rd * tt;

    if (p.y < 0.0) continue;

    float r = length(p);
    float maskS = 1.0 - smoothstep(sphereR, sphereR + sphereFade, r);
    if (maskS <= 0.0) continue;

    float maskY = exp(-p.y / 1.25);
    float mask = maskS * maskY;
    if (mask <= 0.0) continue;

    // Global interference estimate at point p.
    float sum = globalWaveSum(p, uTime, k, phaseGain);

    // Nonlinear emergence: vacuum -> sudden matter above threshold.
    float thr = max(0.001, uThr);
    float node = max(0.0, abs(sum) - thr);

    // Nonlinear self-focusing: stronger medium energy sharpens nodes.
    // Sample medium on the boundary plane (approx) at the projected xz.
    vec2 uProj = clamp((p.xz / 2.1) * 0.5 + 0.5, 0.0, 1.0);
    float uBoundary = sampleField(uProj);
    float amp = abs(uBoundary);
    float zRef = max(0.03, uURef);
    float amp01 = 1.0 - exp(-amp / (zRef * 1.1));
    float gamma = mix(max(0.9, uGammaBase - 0.55), uGammaBase + 0.55, saturate(amp01));

    float dens = pow(node / (thr * 1.25 + 1e-6), gamma);

    // Add a faint field haze so you still see the medium breathing.
    float haze = 0.010 * (1.0 - exp(-abs(sum) * 2.0));

    dens = saturate((dens + haze) * mask);

    // Color and white core.
    vec3 c = palette(sum, dens);

    // Accumulate with a slightly higher step alpha; tonemapping/exposure happens later.
    float a = dens * 0.22;

    accumC += (1.0 - accumA) * c * a;
    accumA += (1.0 - accumA) * a;

    if (accumA > 0.985) break;
  }

  // Apply exposure in linear-ish space.
  vec3 sampleCol = accumC * (uExposure * uExposureBoost) + uBg * (1.0 - accumA);

  // Temporal feedback: modulated by turbulence.
  // Higher turbulence -> lower feedback (faster response, noisier).
  // Lower turbulence -> higher feedback (more stable/sharp).
  float delta = sampleDelta(vUv);
  float fb = mix(uFeedbackStable, uFeedbackTurb, saturate(delta * uDeltaGain));

  vec3 prev = texture2D(uPrev, vUv).rgb;
  vec3 next = mix(sampleCol, prev, fb);

  gl_FragColor = vec4(next, 1.0);
}
`;

// Pass 2: display/tonemap + debug views.
// uMode:
// 0 = hologram (tonemapped accum)
// 1 = sources
// 2 = field
// 3 = delta
// 4 = accum raw
const FS_DISPLAY = `
precision mediump float;

varying vec2 vUv;
uniform sampler2D uTex;
uniform sampler2D uField;
uniform sampler2D uSource;
uniform sampler2D uDelta;
uniform float uFieldNorm;
uniform float uMode;
uniform vec3 uBg;
uniform vec3 uMatter;
uniform vec3 uAnti;

float sampleField(vec2 uv) {
  float v = texture2D(uField, uv).r;
  return (v - 0.5) * uFieldNorm;
}

float sampleSource(vec2 uv) {
  float v = texture2D(uSource, uv).r;
  float s = (v * 255.0 - 128.0) / 127.0;
  return clamp(s, -1.0, 1.0);
}

void main() {
  if (uMode < 0.5) {
    vec3 c = texture2D(uTex, vUv).rgb;
    c = c / (vec3(1.0) + c);
    c = mix(uBg, c, 0.98);
    gl_FragColor = vec4(c, 1.0);
    return;
  }

  if (uMode < 1.5) {
    float s = sampleSource(vUv);
    vec3 c = mix(uBg, vec3(1.0), smoothstep(0.0, 0.02, abs(s)));
    c = mix(c, uMatter, smoothstep(0.05, 0.2, -s));
    c = mix(c, uAnti, smoothstep(0.05, 0.2, s));
    gl_FragColor = vec4(c, 1.0);
    return;
  }

  if (uMode < 2.5) {
    float f = sampleField(vUv);
    float a = clamp(abs(f) / max(0.001, uFieldNorm), 0.0, 1.0);
    vec3 c = mix(uBg, vec3(0.4, 0.9, 1.0), a);
    if (f < 0.0) c = mix(uBg, vec3(1.0, 0.5, 0.2), a);
    gl_FragColor = vec4(c, 1.0);
    return;
  }

  if (uMode < 3.5) {
    float d = texture2D(uDelta, vUv).r;
    vec3 c = mix(uBg, vec3(d), 0.98);
    gl_FragColor = vec4(c, 1.0);
    return;
  }

  vec3 c = texture2D(uTex, vUv).rgb;
  // raw view, exaggerated
  c *= 6.0;
  c = c / (vec3(1.0) + c);
  gl_FragColor = vec4(mix(uBg, c, 0.98), 1.0);
}
`;

type WebGLState = {
  gl: WebGLRenderingContext;
  vbo: WebGLBuffer;

  // Scene textures (from data)
  fieldTex: WebGLTexture;
  sourceTex: WebGLTexture;
  deltaTex: WebGLTexture;
  fieldMode: 'float' | 'half' | 'byte';

  // Accumulation ping-pong
  accumTexA: WebGLTexture;
  accumTexB: WebGLTexture;
  accumType: number; // gl.FLOAT | ext.HALF_FLOAT_OES | gl.UNSIGNED_BYTE

  fboA: WebGLFramebuffer;
  fboB: WebGLFramebuffer;
  accumW: number;
  accumH: number;
  ping: 0 | 1;

  // Programs
  progAccum: WebGLProgram;
  progDisplay: WebGLProgram;

  // Locations (accum)
  aPosAccum: number;
  uPrev: WebGLUniformLocation;
  uField: WebGLUniformLocation;
  uSource: WebGLUniformLocation;
  uDelta: WebGLUniformLocation;
  uFieldNorm: WebGLUniformLocation;
  uURef: WebGLUniformLocation;
  uTime: WebGLUniformLocation;
  uAspect: WebGLUniformLocation;
  uYaw: WebGLUniformLocation;
  uPitch: WebGLUniformLocation;
  uZoom: WebGLUniformLocation;
  uK: WebGLUniformLocation;
  uPhaseGain: WebGLUniformLocation;
  uThr: WebGLUniformLocation;
  uGammaBase: WebGLUniformLocation;
  uSphereR: WebGLUniformLocation;
  uSphereFade: WebGLUniformLocation;
  uExposureBoost: WebGLUniformLocation;
  uGridN: WebGLUniformLocation;
  uSteps: WebGLUniformLocation;

  uBgAccum: WebGLUniformLocation;
  uMatter: WebGLUniformLocation;
  uAnti: WebGLUniformLocation;
  uSeed: WebGLUniformLocation;
  uFeedbackStable: WebGLUniformLocation;
  uFeedbackTurb: WebGLUniformLocation;
  uDeltaGain: WebGLUniformLocation;
  uExposure: WebGLUniformLocation;

  // Locations (display)
  aPosDisplay: number;
  uTexDisplay: WebGLUniformLocation;
  uFieldDisplay: WebGLUniformLocation;
  uSourceDisplay: WebGLUniformLocation;
  uDeltaDisplay: WebGLUniformLocation;
  uFieldNormDisplay: WebGLUniformLocation;
  uModeDisplay: WebGLUniformLocation;
  uBgDisplay: WebGLUniformLocation;
  uMatterDisplay: WebGLUniformLocation;
  uAntiDisplay: WebGLUniformLocation;
};

function attachTextureToFbo(gl: WebGLRenderingContext, fbo: WebGLFramebuffer, tex: WebGLTexture, w: number, h: number, type: number) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  setupLinearTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, type, null);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return status === gl.FRAMEBUFFER_COMPLETE;
}

export default function HolographicConway3DPreview({
  frame,
  enabled,
  className,
  renderer = 'webgl',
  viewMode,
  tuning: tuningFromProps,
  copyDebugNonce,
}: Props) {
  void copyDebugNonce;
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webglRef = useRef<WebGLState | null>(null);
  const frameRef = useRef<MediumPreviewFrame | null>(frame);
  const prevVisRef = useRef<Float32Array | null>(null);
  const orbitRef = useRef<Orbit>({ yaw: 0.35, pitch: 0.25, zoom: 0.92 });
  const tuningRef = useRef<{
    steps: number;
    gridN: number;
    thr: number;
    gamma: number;
    k: number;
    phaseGain: number;
    exposureBoost: number;
    feedbackStable: number;
    feedbackTurb: number;
    deltaGain: number;
    sphereR: number;
    sphereFade: number;
  } | null>(null);

  const dragRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const viewModeRef = useRef(0);

  const [orbit, setOrbitState] = useState<Orbit>({ yaw: 0.35, pitch: 0.25, zoom: 0.92 });
  const [tuning, setTuningState] = useState<Tuning>(tuningFromProps);

  const setOrbit = (next: Orbit | ((prev: Orbit) => Orbit)) => {
    setOrbitState((prev) => (typeof next === 'function' ? (next as (p: Orbit) => Orbit)(prev) : next));
  };

  // Keep tuning in sync with props.
  useEffect(() => setTuningState(tuningFromProps), [tuningFromProps]);
  const [resizeNonce, setResizeNonce] = useState(0);
  const [webglSupported, setWebglSupported] = useState(true);

  const rendererEffective = renderer === 'webgl' && webglSupported ? 'webgl' : 'canvas2d';

  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  useEffect(() => {
    orbitRef.current = orbit;
  }, [orbit]);

  useEffect(() => {
    viewModeRef.current = viewMode;

    // When switching views, clear accumulation so changes are immediate.
    const s = webglRef.current;
    if (s) {
      const gl = s.gl;
      // Read CSS var directly to avoid using `colors` before its declaration.
      const bg = rgbToVec3(parseCssColor(readCssVar('--canvas') || '#000'));
      for (const fbo of [s.fboA, s.fboB]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, s.accumW || 1, s.accumH || 1);
        gl.clearColor(bg[0], bg[1], bg[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      s.ping = 0;
    }
  }, [viewMode]);

  useEffect(() => {
    tuningRef.current = tuning;
  }, [tuning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(() => setResizeNonce((n) => n + 1));
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      dragRef.current = { active: true, x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      dragRef.current.x = e.clientX;
      dragRef.current.y = e.clientY;

      setOrbit((o) => {
        const yaw = o.yaw + dx * 0.0021;
        const pitch = clamp(o.pitch + dy * 0.0021, -1.15, 1.15);
        return { ...o, yaw, pitch };
      });
    };

    const onMouseUp = () => {
      dragRef.current.active = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.sign(e.deltaY);
      setOrbit((o) => ({ ...o, zoom: clamp(o.zoom * (delta > 0 ? 1.06 : 0.94), 0.65, 2.2) }));
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, []);

  const colors = useMemo(() => {
    return {
      matter: parseCssColor(readCssVar('--cell') || '#c6ff6b'),
      anti: parseCssColor(readCssVar('--anti-cell') || '#ff4fd8'),
      bg: parseCssColor(readCssVar('--canvas') || '#000'),
    };
  }, [resizeNonce]);

  // WebGL init
  useEffect(() => {
    if (rendererEffective !== 'webgl') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (webglRef.current) return;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: false, stencil: false });
    if (!gl) {
      setWebglSupported(false);
      return;
    }

    const progAccum = createProgram(gl, VS_SOURCE, FS_ACCUM);
    const progDisplay = createProgram(gl, VS_SOURCE, FS_DISPLAY);
    if (!progAccum || !progDisplay) {
      setWebglSupported(false);
      return;
    }

    const vbo = gl.createBuffer();
    if (!vbo) {
      gl.deleteProgram(progAccum);
      gl.deleteProgram(progDisplay);
      setWebglSupported(false);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const fieldTex = createTexture(gl);
    const sourceTex = createTexture(gl);
    const accumTexA = createTexture(gl);
    const accumTexB = createTexture(gl);
    const fboA = createFramebuffer(gl);
    const fboB = createFramebuffer(gl);

    if (!fieldTex || !sourceTex || !accumTexA || !accumTexB || !fboA || !fboB) {
      if (fieldTex) gl.deleteTexture(fieldTex);
      if (sourceTex) gl.deleteTexture(sourceTex);
      if (accumTexA) gl.deleteTexture(accumTexA);
      if (accumTexB) gl.deleteTexture(accumTexB);
      if (fboA) gl.deleteFramebuffer(fboA);
      if (fboB) gl.deleteFramebuffer(fboB);
      gl.deleteBuffer(vbo);
      gl.deleteProgram(progAccum);
      gl.deleteProgram(progDisplay);
      setWebglSupported(false);
      return;
    }

    const extFloat = gl.getExtension('OES_texture_float');
    const extHalf = gl.getExtension('OES_texture_half_float');
    const extFloatLin = gl.getExtension('OES_texture_float_linear');
    const extHalfLin = gl.getExtension('OES_texture_half_float_linear');

    // eslint-disable-next-line no-console
    console.log('[Holographic] Extensions:', {
      float: !!extFloat,
      floatLin: !!extFloatLin,
      half: !!extHalf,
      halfLin: !!extHalfLin,
    });

    // Decide precision for field texture and accumulation buffers.
    // Order: float > half > byte.
    // For field, we need linearity if we want smooth sampling, but we can live with nearest.
    // For accum, we really need float/half for >1 range and precision.

    let fieldMode: 'float' | 'half' | 'byte' = 'byte';
    let accumType: number = gl.UNSIGNED_BYTE;

    if (extFloat) {
      fieldMode = 'float';
      accumType = gl.FLOAT;
    } else if (extHalf) {
      fieldMode = 'half';
      accumType = extHalf.HALF_FLOAT_OES;
    } else {
      fieldMode = 'byte';
      accumType = gl.UNSIGNED_BYTE;
    }

    // Uniform locations for accum
    const aPosAccum = gl.getAttribLocation(progAccum, 'aPos');
    const uPrev = gl.getUniformLocation(progAccum, 'uPrev');
    const uField = gl.getUniformLocation(progAccum, 'uField');
    const uSource = gl.getUniformLocation(progAccum, 'uSource');
    const uFieldNorm = gl.getUniformLocation(progAccum, 'uFieldNorm');
    const uURef = gl.getUniformLocation(progAccum, 'uURef');
    const uTime = gl.getUniformLocation(progAccum, 'uTime');
    const uAspect = gl.getUniformLocation(progAccum, 'uAspect');
    const uYaw = gl.getUniformLocation(progAccum, 'uYaw');
    const uPitch = gl.getUniformLocation(progAccum, 'uPitch');
    const uZoom = gl.getUniformLocation(progAccum, 'uZoom');

    const uK = gl.getUniformLocation(progAccum, 'uK');
    const uPhaseGain = gl.getUniformLocation(progAccum, 'uPhaseGain');
    const uThr = gl.getUniformLocation(progAccum, 'uThr');
    const uGammaBase = gl.getUniformLocation(progAccum, 'uGammaBase');
    const uSphereR = gl.getUniformLocation(progAccum, 'uSphereR');
    const uSphereFade = gl.getUniformLocation(progAccum, 'uSphereFade');
    const uExposureBoost = gl.getUniformLocation(progAccum, 'uExposureBoost');
    const uGridN = gl.getUniformLocation(progAccum, 'uGridN');
    const uSteps = gl.getUniformLocation(progAccum, 'uSteps');

    const uBgAccum = gl.getUniformLocation(progAccum, 'uBg');
    const uMatter = gl.getUniformLocation(progAccum, 'uMatter');
    const uAnti = gl.getUniformLocation(progAccum, 'uAnti');
    const uSeed = gl.getUniformLocation(progAccum, 'uSeed');
    const uFeedbackStable = gl.getUniformLocation(progAccum, 'uFeedbackStable');
    const uFeedbackTurb = gl.getUniformLocation(progAccum, 'uFeedbackTurb');
    const uDeltaGain = gl.getUniformLocation(progAccum, 'uDeltaGain');
    const uExposure = gl.getUniformLocation(progAccum, 'uExposure');

    // Uniform locations for display
    const aPosDisplay = gl.getAttribLocation(progDisplay, 'aPos');
    const uTexDisplay = gl.getUniformLocation(progDisplay, 'uTex');
    const uFieldDisplay = gl.getUniformLocation(progDisplay, 'uField');
    const uSourceDisplay = gl.getUniformLocation(progDisplay, 'uSource');
    const uDeltaDisplay = gl.getUniformLocation(progDisplay, 'uDelta');
    const uFieldNormDisplay = gl.getUniformLocation(progDisplay, 'uFieldNorm');
    const uModeDisplay = gl.getUniformLocation(progDisplay, 'uMode');
    const uBgDisplay = gl.getUniformLocation(progDisplay, 'uBg');
    const uMatterDisplay = gl.getUniformLocation(progDisplay, 'uMatter');
    const uAntiDisplay = gl.getUniformLocation(progDisplay, 'uAnti');

    const uDelta = gl.getUniformLocation(progAccum, 'uDelta');

    if (
      !uPrev ||
      !uField ||
      !uSource ||
      !uDelta ||
      !uFieldNorm ||
      !uURef ||
      !uTime ||
      !uAspect ||
      !uYaw ||
      !uPitch ||
      !uZoom ||
      !uK ||
      !uPhaseGain ||
      !uThr ||
      !uGammaBase ||
      !uSphereR ||
      !uSphereFade ||
      !uExposureBoost ||
      !uGridN ||
      !uSteps ||
      !uBgAccum ||
      !uMatter ||
      !uAnti ||
      !uSeed ||
      !uFeedbackStable ||
      !uFeedbackTurb ||
      !uDeltaGain ||
      !uExposure ||
      !uTexDisplay ||
      !uFieldDisplay ||
      !uSourceDisplay ||
      !uDeltaDisplay ||
      !uFieldNormDisplay ||
      !uModeDisplay ||
      !uBgDisplay ||
      !uMatterDisplay ||
      !uAntiDisplay
    ) {
      gl.deleteTexture(fieldTex);
      gl.deleteTexture(sourceTex);
      gl.deleteTexture(accumTexA);
      gl.deleteTexture(accumTexB);
      gl.deleteFramebuffer(fboA);
      gl.deleteFramebuffer(fboB);
      gl.deleteBuffer(vbo);
      gl.deleteProgram(progAccum);
      gl.deleteProgram(progDisplay);
      setWebglSupported(false);
      return;
    }

    const deltaTex = (() => {
      const t = createTexture(gl);
      if (!t) throw new Error('deltaTex');
      return t;
    })();

    webglRef.current = {
      gl,
      vbo,
      fieldTex,
      sourceTex,
      deltaTex,
      fieldMode,
      accumTexA,
      accumTexB,
      accumType,
      fboA,
      fboB,
      accumW: 0,
      accumH: 0,
      ping: 0,
      progAccum,
      progDisplay,
      aPosAccum,
      uPrev,
      uField,
      uSource,
      uDelta,
      uFieldNorm,
      uURef,
      uTime,
      uAspect,
      uYaw,
      uPitch,
      uZoom,
      uK,
      uPhaseGain,
      uThr,
      uGammaBase,
      uSphereR,
      uSphereFade,
      uExposureBoost,
      uGridN,
      uSteps,
      uBgAccum,
      uMatter,
      uAnti,
      uSeed,
      uFeedbackStable,
      uFeedbackTurb,
      uDeltaGain,
      uExposure,
      aPosDisplay,
      uTexDisplay,
      uFieldDisplay,
      uSourceDisplay,
      uDeltaDisplay,
      uFieldNormDisplay,
      uModeDisplay,
      uBgDisplay,
      uMatterDisplay,
      uAntiDisplay,
    };

    return () => {
      const s = webglRef.current;
      if (!s) return;
      s.gl.deleteTexture(s.fieldTex);
      s.gl.deleteTexture(s.sourceTex);
      s.gl.deleteTexture(s.deltaTex);
      s.gl.deleteTexture(s.accumTexA);
      s.gl.deleteTexture(s.accumTexB);
      s.gl.deleteFramebuffer(s.fboA);
      s.gl.deleteFramebuffer(s.fboB);
      s.gl.deleteBuffer(s.vbo);
      s.gl.deleteProgram(s.progAccum);
      s.gl.deleteProgram(s.progDisplay);
      webglRef.current = null;
    };
  }, [rendererEffective]);

  // Render loop (temporal accumulation)
  useEffect(() => {
    if (rendererEffective !== 'webgl') return;

    const canvas = canvasRef.current;
    const state = webglRef.current;
    if (!canvas || !state) return;

    let raf = 0;
    let seed = 1;

    const draw = () => {
      const gl = state.gl;

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);

      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      // Accumulation buffer resolution (lower than screen for speed)
      const accW = Math.max(1, Math.floor(w * 0.7));
      const accH = Math.max(1, Math.floor(h * 0.7));

      if (state.accumW !== accW || state.accumH !== accH) {
        state.accumW = accW;
        state.accumH = accH;
        state.ping = 0;

        const okA = attachTextureToFbo(gl, state.fboA, state.accumTexA, accW, accH, state.accumType);
        const okB = attachTextureToFbo(gl, state.fboB, state.accumTexB, accW, accH, state.accumType);

        if (!okA || !okB) {
          // eslint-disable-next-line no-console
          console.warn('[Holographic] framebuffer incomplete');
        }

        // Clear both accum buffers to background.
        const bg = rgbToVec3(colors.bg);
        for (const fbo of [state.fboA, state.fboB]) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
          gl.viewport(0, 0, accW, accH);
          gl.clearColor(bg[0], bg[1], bg[2], 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }

      const bg = rgbToVec3(colors.bg);
      const matter = rgbToVec3(colors.matter);
      const anti = rgbToVec3(colors.anti);

      // Update data textures.
      const fr = frameRef.current;
      const fieldOk = enabled && !!fr;
      const data = fr?.data;
      const src = fr?.sources;
      const fieldW = fr?.w ?? 1;
      const fieldH = fr?.h ?? 1;

      const hasField =
        fieldOk &&
        !!data &&
        !!src &&
        fieldW >= 2 &&
        fieldH >= 2 &&
        data.length >= fieldW * fieldH &&
        src.length >= fieldW * fieldH;

      const uRef = Math.max(0.03, fr?.uRef ?? 0.1);
      const uHi = Math.max(uRef * 1.05, fr?.uHi ?? uRef);
      const uNorm = Math.max(uRef * 6, uHi * 1.2, 0.15);

      // Upload field
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, state.fieldTex);
      setupLinearTexture(gl); // Ideally linear, but fallback to nearest if needed implicitly.

      if (hasField) {
        if (state.fieldMode === 'float') {
          const packed = new Float32Array(fieldW * fieldH);
          for (let i = 0; i < packed.length; i++) {
            const u = data?.[i] ?? 0;
            packed[i] = 0.5 + clamp(u / uNorm, -0.5, 0.5);
          }
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, fieldW, fieldH, 0, gl.LUMINANCE, gl.FLOAT, packed);
        } else if (state.fieldMode === 'half') {
          // WebGL1 usually doesn't support uploading Float16Array directly via texImage2D without extra work,
          // but if we have OES_texture_half_float, we can upload FLOAT and it converts, OR we fall back to bytes.
          // For simplicity/robustness in this shim: if half-float is supported, we often can just upload float32
          // and driver converts, OR we use bytes if that fails.
          // Let's stick to byte packing for half-mode to be safe, or try float.
          // SAFEST: Use BYTE packing even for half-float mode if we don't want to implement float16 conversion in JS.
          const packed = new Uint8Array(fieldW * fieldH);
          for (let i = 0; i < packed.length; i++) {
            const u = data?.[i] ?? 0;
            packed[i] = clamp(Math.round((0.5 + clamp(u / uNorm, -0.5, 0.5)) * 255), 0, 255);
          }
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, fieldW, fieldH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, packed);
        } else {
          // Byte mode
          const packed = new Uint8Array(fieldW * fieldH);
          for (let i = 0; i < packed.length; i++) {
            const u = data?.[i] ?? 0;
            packed[i] = clamp(Math.round((0.5 + clamp(u / uNorm, -0.5, 0.5)) * 255), 0, 255);
          }
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, fieldW, fieldH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, packed);
        }
      } else {
        setupNearestTexture(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([128]));
      }

      // Upload source
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, state.sourceTex);
      setupNearestTexture(gl);

      if (hasField) {
        const packed = new Uint8Array(fieldW * fieldH);
        for (let i = 0; i < packed.length; i++) {
          const s = src?.[i] ?? 0;
          const v = 0.5 + clamp(s, -1, 1) * 0.5;
          packed[i] = clamp(Math.round(v * 255), 0, 255);
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, fieldW, fieldH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, packed);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([128]));
      }

      // Upload delta (turbulence map) for adaptive temporal feedback.
      // Requested mode (2): use speed of change |uVis(t) - uVis(t-1)|.
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, state.deltaTex);
      setupLinearTexture(gl);

      if (hasField) {
        const packed = new Uint8Array(fieldW * fieldH);

        const prev = prevVisRef.current;
        if (!prev || prev.length !== fieldW * fieldH) {
          prevVisRef.current = new Float32Array(fieldW * fieldH);
        }

        const prev2 = prevVisRef.current!;

        // Normalize deltas by a scale derived from uNorm (keeps slider behavior stable).
        const inv = 1.0 / Math.max(1e-6, uNorm);

        for (let i = 0; i < packed.length; i++) {
          const u = (data?.[i] ?? 0) as number;
          const d = Math.abs(u - (prev2[i] ?? 0));
          prev2[i] = u;

          const t = clamp(d * inv * 2.0, 0, 1);
          packed[i] = clamp(Math.round(t * 255), 0, 255);
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, fieldW, fieldH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, packed);
      } else {
        prevVisRef.current = null;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([0]));
      }

      // Choose ping-pong buffers.
      const prevTex = state.ping === 0 ? state.accumTexA : state.accumTexB;
      const nextTex = state.ping === 0 ? state.accumTexB : state.accumTexA;
      const nextFbo = state.ping === 0 ? state.fboB : state.fboA;

      // Pass 1: accum into FBO
      gl.bindFramebuffer(gl.FRAMEBUFFER, nextFbo);
      gl.viewport(0, 0, state.accumW, state.accumH);

      gl.useProgram(state.progAccum);

      gl.bindBuffer(gl.ARRAY_BUFFER, state.vbo);
      gl.enableVertexAttribArray(state.aPosAccum);
      gl.vertexAttribPointer(state.aPosAccum, 2, gl.FLOAT, false, 0, 0);

      // prev accum
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, prevTex);
      setupLinearTexture(gl);
      gl.uniform1i(state.uPrev, 0);

      gl.uniform1i(state.uField, 1);
      gl.uniform1i(state.uSource, 2);
      gl.uniform1i(state.uDelta, 3);
      gl.uniform1f(state.uFieldNorm, uNorm);
      gl.uniform1f(state.uURef, uRef);

      const now = performance.now() * 0.001;
      gl.uniform1f(state.uTime, now);
      gl.uniform1f(state.uAspect, state.accumW / Math.max(1, state.accumH));

      const o = orbitRef.current;
      gl.uniform1f(state.uYaw, o.yaw);
      gl.uniform1f(state.uPitch, o.pitch);
      gl.uniform1f(state.uZoom, o.zoom);

      const tun = tuningRef.current ?? {
        steps: 28,
        gridN: 8,
        thr: 0.06,
        gamma: 1.85,
        k: 13,
        phaseGain: 5,
        exposureBoost: 1,
        feedbackStable: 0.965,
        feedbackTurb: 0.88,
        deltaGain: 1.8,
        sphereR: 2.1,
        sphereFade: 0.9,
      };

      gl.uniform1f(state.uK, tun.k);
      gl.uniform1f(state.uPhaseGain, tun.phaseGain);
      gl.uniform1f(state.uThr, tun.thr);
      gl.uniform1f(state.uGammaBase, tun.gamma);
      gl.uniform1f(state.uSphereR, tun.sphereR);
      gl.uniform1f(state.uSphereFade, tun.sphereFade);
      gl.uniform1f(state.uExposureBoost, tun.exposureBoost);
      gl.uniform1f(state.uGridN, tun.gridN);
      gl.uniform1f(state.uSteps, tun.steps);

      gl.uniform3f(state.uBgAccum, bg[0], bg[1], bg[2]);
      gl.uniform3f(state.uMatter, matter[0], matter[1], matter[2]);
      gl.uniform3f(state.uAnti, anti[0], anti[1], anti[2]);

      // Temporal feedback/ghosting.
      // We modulate this in-shader via uDelta.
      gl.uniform1f(state.uFeedbackStable, tun.feedbackStable);
      gl.uniform1f(state.uFeedbackTurb, tun.feedbackTurb);
      gl.uniform1f(state.uDeltaGain, tun.deltaGain);

      // Auto exposure: keep stable while accumulation converges.
      // Larger absP95 -> lower exposure.
      const p95 = Math.max(0.001, fr?.absP95 ?? uRef);
      const exposure = clamp(2.2 / (0.22 + p95 * 1.15), 0.35, 6.0);
      gl.uniform1f(state.uExposure, exposure);

      // Seed changes every frame.
      seed = (seed * 1664525 + 1013904223) >>> 0;
      gl.uniform1f(state.uSeed, (seed % 100000) / 100000);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Pass 2: display
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);

      gl.useProgram(state.progDisplay);
      gl.bindBuffer(gl.ARRAY_BUFFER, state.vbo);
      gl.enableVertexAttribArray(state.aPosDisplay);
      gl.vertexAttribPointer(state.aPosDisplay, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, nextTex);
      setupLinearTexture(gl);
      gl.uniform1i(state.uTexDisplay, 0);

      gl.uniform3f(state.uBgDisplay, bg[0], bg[1], bg[2]);
      gl.uniform3f(state.uMatterDisplay, matter[0], matter[1], matter[2]);
      gl.uniform3f(state.uAntiDisplay, anti[0], anti[1], anti[2]);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, state.fieldTex);
      setupLinearTexture(gl);
      gl.uniform1i(state.uFieldDisplay, 1);

      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, state.sourceTex);
      setupNearestTexture(gl);
      gl.uniform1i(state.uSourceDisplay, 2);

      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, state.deltaTex);
      setupLinearTexture(gl);
      gl.uniform1i(state.uDeltaDisplay, 3);

      gl.uniform1f(state.uFieldNormDisplay, uNorm);
      gl.uniform1f(state.uModeDisplay, viewModeRef.current);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Swap
      state.ping = state.ping === 0 ? 1 : 0;

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [colors, enabled, rendererEffective, resizeNonce]);

  // Canvas2D fallback
  useEffect(() => {
    if (rendererEffective !== 'canvas2d') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Force non-zero dimensions if rect is 0x0 (e.g. hidden or layout issue).
    const rectW = rect.width || 300;
    const rectH = rect.height || 150;

    const w = Math.max(1, Math.floor(rectW * dpr));
    const h = Math.max(1, Math.floor(rectH * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Explicitly clear to opaque black before anything else.
    // If background is meant to be canvas color, use it, but force alpha=1.
    ctx.fillStyle = `rgb(${colors.bg.r},${colors.bg.g},${colors.bg.b})`;
    ctx.fillRect(0, 0, w, h);

    const fr = frameRef.current;
    if (!enabled || !fr) return;

    const mode = viewMode;
    // eslint-disable-next-line no-console
    // console.log('[Holographic] Canvas2D: painting mode', mode);


    // Mode 1: Sources
    if (mode === 1) {
      const gridW = fr.w;
      const gridH = fr.h;
      const sources = fr.sources;
      const img = ctx.createImageData(gridW, gridH);

      for (let i = 0; i < sources.length; i++) {
        const s = sources[i] ?? 0;
        const o = i * 4;
        if (s === 0) {
          img.data[o + 3] = 255;
          continue;
        }

        // matter = greenish, anti = magenta, mix to white at extremes
        if (s < 0) {
          img.data[o + 0] = 80;
          img.data[o + 1] = 255;
          img.data[o + 2] = 140;
        } else {
          img.data[o + 0] = 255;
          img.data[o + 1] = 90;
          img.data[o + 2] = 210;
        }
        img.data[o + 3] = 255;
      }

      const tmp = document.createElement('canvas');
      tmp.width = gridW;
      tmp.height = gridH;
      const tctx = tmp.getContext('2d');
      if (tctx) {
        tctx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tmp, 0, 0, w, h);
      }
      return;
    }

    // Mode 2: Field (uVis)
    if (mode === 2) {
      const gridW = fr.w;
      const gridH = fr.h;
      const data = fr.data;
      const uNorm = Math.max(fr.uRef * 6, fr.uHi * 1.2, 0.15);
      const img = ctx.createImageData(gridW, gridH);

      for (let i = 0; i < data.length; i++) {
        const u = data[i] ?? 0;
        const a = Math.min(1, Math.abs(u) / uNorm);
        const o = i * 4;
        if (u >= 0) {
          img.data[o + 0] = Math.round(60 + 140 * a);
          img.data[o + 1] = Math.round(120 + 135 * a);
          img.data[o + 2] = 255;
        } else {
          img.data[o + 0] = 255;
          img.data[o + 1] = Math.round(90 + 80 * a);
          img.data[o + 2] = Math.round(40 + 60 * a);
        }
        img.data[o + 3] = 255;
      }

      const tmp = document.createElement('canvas');
      tmp.width = gridW;
      tmp.height = gridH;
      const tctx = tmp.getContext('2d');
      if (tctx) {
        tctx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tmp, 0, 0, w, h);
      }
      return;
    }

    // Mode 3: Delta (|uVis(t)-uVis(t-1)|)
    if (mode === 3) {
      const gridW = fr.w;
      const gridH = fr.h;
      const data = fr.data;
      const uNorm = Math.max(fr.uRef * 6, fr.uHi * 1.2, 0.15);
      const img = ctx.createImageData(gridW, gridH);

      if (!prevVisRef.current || prevVisRef.current.length !== data.length) {
        prevVisRef.current = new Float32Array(data.length);
      }
      const prev = prevVisRef.current;

      for (let i = 0; i < data.length; i++) {
        const u = data[i] ?? 0;
        const d = Math.abs(u - (prev[i] ?? 0));
        prev[i] = u;
        const a = Math.min(1, (d / uNorm) * 2);
        const o = i * 4;
        const v = Math.round(255 * a);
        img.data[o + 0] = v;
        img.data[o + 1] = v;
        img.data[o + 2] = v;
        img.data[o + 3] = 255;
      }

      const tmp = document.createElement('canvas');
      tmp.width = gridW;
      tmp.height = gridH;
      const tctx = tmp.getContext('2d');
      if (tctx) {
        tctx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tmp, 0, 0, w, h);
      }
      return;
    }

    // Mode 0/4 fallback: show emitter locations as glows.
    const gridW = fr.w;
    const gridH = fr.h;
    const sources = fr.sources;

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const s = sources[y * gridW + x] ?? 0;
        if (s === 0) continue;

        const sx = (x / (gridW - 1)) * w;
        const sy = (y / (gridH - 1)) * h;

        const r = 6 * dpr;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        grad.addColorStop(0, `rgba(255,255,255,0.25)`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [colors, enabled, frame, rendererEffective, resizeNonce, viewMode]);



  return (
    <div className={cn('bg-[var(--canvas)]', className)}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          key={rendererEffective} // Force remount when switching renderers to get a fresh context.
          className="h-full w-full"
          role="img"
          aria-label={t('holographic.aria')}
        />

        <div className="pointer-events-none absolute right-2 top-2 flex flex-col gap-2">
          <Button
            className="pointer-events-auto h-9 w-9 rounded-full p-0"
            onClick={() => setOrbit((o) => ({ ...o, zoom: clamp(o.zoom * 0.92, 0.65, 2.2) }))}
            aria-label={t('holographic.zoomIn')}
          >
            <span className="text-lg leading-none">+</span>
          </Button>
          <Button
            className="pointer-events-auto h-9 w-9 rounded-full p-0"
            onClick={() => setOrbit((o) => ({ ...o, zoom: clamp(o.zoom * 1.08, 0.65, 2.2) }))}
            aria-label={t('holographic.zoomOut')}
          >
            <span className="text-lg leading-none">-</span>
          </Button>
          <Button
            className="pointer-events-auto h-9 w-9 rounded-full p-0"
            onClick={() => setOrbit({ yaw: 0.35, pitch: 0.25, zoom: 0.92 })}
            aria-label={t('holographic.resetView')}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path
                d="M21 12a9 9 0 1 1-3.2-6.9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M21 4v6h-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
      </div>

    </div>
  );
}
