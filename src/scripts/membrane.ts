// Living mesh behind the hero. Physics constants follow the "Membrane" section
// (motionin.design/gallery/membrane): spring-linked vertices, cursor impulses, waves between neighbours.
// Plain canvas 2D: no animation library, no blur filter. The loop only runs while the hero is on screen.
const SPRING = 0.025;
const DAMPING = 0.93;
const SPREAD = 0.18;

type Vertex = { x: number; y: number; rx: number; ry: number; vx: number; vy: number; z: number; vz: number };
type RGB = [number, number, number];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// A colour ramp across the width (orange, pink, violet, blue, teal): ripples pick up the hue of the place they happen.
const RAMP: RGB[] = [
  [255, 91, 46],
  [236, 72, 153],
  [139, 92, 246],
  [59, 130, 246],
  [20, 184, 166],
];
function hueAt(f: number): RGB {
  const x = clamp(f, 0, 1) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x));
  const t = x - i;
  return [0, 1, 2].map((k) => RAMP[i][k] + (RAMP[i + 1][k] - RAMP[i][k]) * t) as RGB;
}

export function mountMembrane(canvas: HTMLCanvasElement, host: HTMLElement, zoneEl: HTMLElement | null) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  let w = 0;
  let h = 0;
  let cols = 0;
  let rows = 0;
  let verts: Vertex[] = [];
  let centerFactor: Float32Array = new Float32Array(0);
  let zoneDim: Float32Array = new Float32Array(0);
  let hues: RGB[] = [];
  let mx = -9999;
  let my = -9999;
  let pressing = false;
  let raf = 0;
  let onScreen = true;
  const t0 = performance.now();

  // Dark: ivory dots on near-black, as in the original. Light: ink dots on cream. The two are blended by `themeT`
  // (0 dark, 1 light), set from the current theme.
  const DARK = { edge: [130, 130, 140] as RGB, center: [245, 235, 210] as RGB, gain: 1.7, line: [255, 255, 255] as RGB, lineA: 0.035 };
  const LIGHT = { edge: [120, 118, 112] as RGB, center: [52, 44, 36] as RGB, gain: 1.9, line: [17, 17, 20] as RGB, lineA: 0.06 };
  const mixRGB = (a: RGB, b: RGB, t: number) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * t) as RGB;
  let themeT = root.dataset.theme === 'light' ? 1 : 0;
  function palette() {
    const t = themeT;
    return {
      edge: mixRGB(DARK.edge, LIGHT.edge, t),
      center: mixRGB(DARK.center, LIGHT.center, t),
      gain: DARK.gain + (LIGHT.gain - DARK.gain) * t,
      line: mixRGB(DARK.line, LIGHT.line, t).map(Math.round).join(','),
      lineA: DARK.lineA + (LIGHT.lineA - DARK.lineA) * t,
    };
  }

  function build() {
    cols = clamp(Math.round(w / 28), 16, 50);
    rows = clamp(Math.round(h / 26), 12, 30);
    verts = [];
    centerFactor = new Float32Array(cols * rows);
    zoneDim = new Float32Array(cols * rows);
    hues = [];
    const cx = w / 2;
    const cy = h / 2;
    const maxDist = Math.hypot(cx, cy);

    // The headline block gets a soft clearing so type stays readable over the dots.
    const hr = host.getBoundingClientRect();
    const zr = zoneEl?.getBoundingClientRect();
    const zcx = zr ? zr.left - hr.left + zr.width / 2 : cx;
    const zcy = zr ? zr.top - hr.top + zr.height / 2 : cy;
    const zw = zr ? zr.width * 0.62 + 48 : w * 0.35;
    const zh = zr ? zr.height * 0.62 + 48 : h * 0.35;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rx = (c / (cols - 1)) * w;
        const ry = (r / (rows - 1)) * h;
        const i = r * cols + c;
        verts.push({ x: rx, y: ry, rx, ry, vx: 0, vy: 0, z: 0, vz: 0 });
        hues.push(hueAt(c / (cols - 1)));
        centerFactor[i] = Math.pow(1 - Math.min(1, (Math.hypot(rx - cx, ry - cy) / maxDist) * 1.4), 1.5);
        const e = ((rx - zcx) / zw) ** 2 + ((ry - zcy) / zh) ** 2;
        zoneDim[i] = e < 1 ? (1 - e) * 0.7 : 0;
      }
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = host.getBoundingClientRect();
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    draw(performance.now());
  }

  function step(time: number) {
    const radius = pressing ? 200 : 130;
    const strength = pressing ? 30 : 15;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = verts[r * cols + c];
        const breathe = Math.sin(time * 0.6 + c * 0.15 + r * 0.12) * 2;
        v.vz += (breathe - v.z) * 0.002;

        const dx = v.x - mx;
        const dy = v.y - my;
        const dist = Math.hypot(dx, dy);
        if (dist < radius && dist > 0.001) {
          const force = (1 - dist / radius) * strength;
          v.vz += force * 0.4;
          v.vx += (dx / dist) * force * 0.12;
          v.vy += (dy / dist) * force * 0.12;
        }

        v.vx += (v.rx - v.x) * SPRING;
        v.vy += (v.ry - v.y) * SPRING;
        v.vz -= v.z * SPRING * 1.5;
        v.vx *= DAMPING;
        v.vy *= DAMPING;
        v.vz *= DAMPING;
        v.x += v.vx;
        v.y += v.vy;
        v.z += v.vz;
      }
    }
    // Ripples: each vertex is pulled toward its four neighbours' height.
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = verts[r * cols + c];
        if (c > 0) v.vz += (verts[r * cols + c - 1].z - v.z) * SPREAD;
        if (c < cols - 1) v.vz += (verts[r * cols + c + 1].z - v.z) * SPREAD;
        if (r > 0) v.vz += (verts[(r - 1) * cols + c].z - v.z) * SPREAD;
        if (r < rows - 1) v.vz += (verts[(r + 1) * cols + c].z - v.z) * SPREAD;
      }
    }
  }

  function draw(now: number) {
    if (!w || !h) return;
    const p = palette();
    ctx!.clearRect(0, 0, w, h);

    // Lines: one path, one stroke.
    ctx!.strokeStyle = `rgba(${p.line},${p.lineA})`;
    ctx!.lineWidth = 0.5;
    ctx!.beginPath();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = verts[r * cols + c];
        const sy = v.y - v.z * 0.3;
        if (c === 0) ctx!.moveTo(v.x, sy);
        else ctx!.lineTo(v.x, sy);
      }
    }
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const v = verts[r * cols + c];
        const sy = v.y - v.z * 0.3;
        if (r === 0) ctx!.moveTo(v.x, sy);
        else ctx!.lineTo(v.x, sy);
      }
    }
    ctx!.stroke();

    for (let i = 0; i < verts.length; i++) {
      const v = verts[i];
      const cf = centerFactor[i];
      const disp = Math.hypot(v.x - v.rx, v.y - v.ry) + Math.abs(v.z) * 0.6;
      const sy = v.y - v.z * 0.3;

      const hue = hues[i];
      let r = p.edge[0] + (p.center[0] - p.edge[0]) * cf;
      let g = p.edge[1] + (p.center[1] - p.edge[1]) * cf;
      let b = p.edge[2] + (p.center[2] - p.edge[2]) * cf;
      // Resting dots carry a little of the local hue; pushed ones carry a lot.
      const tint = disp > 3 ? Math.min(1, 0.45 + disp / 25) : 0.28 * (1 - cf * 0.6);
      r += (hue[0] - r) * tint;
      g += (hue[1] - g) * tint;
      b += (hue[2] - b) * tint;
      const size = 1 + cf + (disp > 0.5 ? disp * 0.05 : 0);
      const baseA = 0.06 + cf * 0.18;
      const activeA = disp > 0.5 ? Math.min(0.9, disp * 0.05) : 0;
      let a = Math.min(0.95, Math.max(baseA, activeA) * p.gain);
      a *= 1 - zoneDim[i];
      if (a < 0.01) continue;

      const rgb = `${r | 0},${g | 0},${b | 0}`;
      if (disp > 1.5 || cf > 0.4) {
        ctx!.fillStyle = `rgba(${hue[0] | 0},${hue[1] | 0},${hue[2] | 0},${a * 0.3})`;
        ctx!.beginPath();
        ctx!.arc(v.x, sy, size + 6, 0, 6.2832);
        ctx!.fill();
      }
      ctx!.fillStyle = `rgba(${rgb},${a})`;
      ctx!.beginPath();
      ctx!.arc(v.x, sy, size, 0, 6.2832);
      ctx!.fill();
    }
    void now;
  }

  function frame(now: number) {
    step((now - t0) / 1000);
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  function running() {
    return onScreen && !document.hidden && !reduce.matches && !root.hasAttribute('data-text');
  }
  function sync() {
    if (running() && !raf) raf = requestAnimationFrame(frame);
    else if (!running() && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function local(e: PointerEvent) {
    const rect = host.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
  }
  host.addEventListener('pointermove', (e) => {
    if (!reduce.matches) local(e);
  });
  host.addEventListener('pointerleave', () => {
    mx = my = -9999;
    pressing = false;
  });
  host.addEventListener('pointerdown', (e) => {
    if (reduce.matches) return;
    local(e);
    pressing = true;
  });
  const release = (e: PointerEvent) => {
    pressing = false;
    if (e.pointerType !== 'mouse') window.setTimeout(() => (mx = my = -9999), 350);
  };
  host.addEventListener('pointerup', release);
  host.addEventListener('pointercancel', release);

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    sync();
  }).observe(host);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', () => {
    sync();
    draw(performance.now());
  });
  new MutationObserver(() => {
    // The page dissolves between themes as a whole (a view transition), so the mesh just takes the new colours.
    themeT = root.dataset.theme === 'light' ? 1 : 0;
    sync();
    draw(performance.now());
  }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-text', 'data-mono'] });
  new ResizeObserver(resize).observe(host);
  document.fonts?.ready.then(resize);

  resize();
  canvas.classList.add('is-on');
  sync();
}
