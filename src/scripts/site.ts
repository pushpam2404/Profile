// Small, dependency-free behaviour: theme and display modes, hotkeys, scroll reveal, active nav link, mobile menu, proof list, hero mesh.
type Pref = 'light' | 'dark' | 'system';
const root = document.documentElement;
const mq = window.matchMedia('(prefers-color-scheme: dark)');

function readPref(): Pref {
  try {
    const v = localStorage.getItem('theme-pref');
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function applyPref(pref: Pref) {
  const dark = pref === 'dark' || (pref === 'system' && mq.matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.pref = pref;
  document.querySelectorAll<HTMLButtonElement>('[data-theme-set]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.themeSet === pref));
  });
  syncMode('dark', dark);
}

const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
function choose(pref: Pref) {
  try {
    if (pref === 'system') localStorage.removeItem('theme-pref');
    else localStorage.setItem('theme-pref', pref);
  } catch {
    /* storage can be blocked; the choice still applies for this visit */
  }
  if ('startViewTransition' in document && !calm.matches) {
    // The whole page dissolves from one theme into the other.
    root.classList.add('theme-vt');
    document.startViewTransition(() => applyPref(pref)).finished.finally(() => root.classList.remove('theme-vt'));
  } else {
    applyPref(pref);
  }
}

// Display modes shown in the hero strip. Text mode and monochrome are flags on <html>; dark is the theme.
const modeButtons = document.querySelectorAll<HTMLButtonElement>('[data-mode]');
function syncMode(name: string, on: boolean) {
  modeButtons.forEach((b) => {
    if (b.dataset.mode !== name) return;
    b.setAttribute('aria-pressed', String(on));
    const letter = b.querySelector('.mode-letter');
    if (letter) letter.textContent = on ? 'Y' : 'N';
  });
  paintChip();
}

// A mode that is on stays visible and switch-off-able from anywhere on the page.
const chip = document.getElementById('mode-chip');
function paintChip() {
  if (!chip) return;
  const on = [
    { name: 'text', label: 'Text mode on', key: 'T' },
    { name: 'mono', label: 'Monochrome on', key: 'M' },
  ].filter((m) => root.hasAttribute(`data-${m.name}`));
  chip.replaceChildren(
    ...on.map((m) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `${m.label}. Press to turn off`);
      b.append(m.label, Object.assign(document.createElement('span'), { textContent: `${m.key} to turn off` }));
      b.addEventListener('click', () => toggleMode(m.name));
      return b;
    }),
  );
  chip.hidden = on.length === 0;
}
function toggleMode(name: string) {
  if (name === 'dark') return choose(root.dataset.theme === 'dark' ? 'light' : 'dark');
  const on = !root.hasAttribute(`data-${name}`);
  root.toggleAttribute(`data-${name}`, on);
  try {
    if (on) localStorage.setItem(`mode-${name}`, '1');
    else localStorage.removeItem(`mode-${name}`);
  } catch {
    /* ignore */
  }
  syncMode(name, on);
}
modeButtons.forEach((b) => b.addEventListener('click', () => toggleMode(b.dataset.mode!)));
syncMode('text', root.hasAttribute('data-text'));
syncMode('mono', root.hasAttribute('data-mono'));
paintChip();

const keys: Record<string, string> = { t: 'text', d: 'dark', m: 'mono' };
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
  const t = e.target as HTMLElement;
  if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
  const mode = keys[e.key.toLowerCase()];
  if (mode) toggleMode(mode);
});

applyPref(readPref());
document.querySelectorAll<HTMLButtonElement>('[data-theme-set]').forEach((b) => {
  b.addEventListener('click', () => choose(b.dataset.themeSet as Pref));
});
mq.addEventListener('change', () => {
  if (readPref() === 'system') applyPref('system');
});

// Scroll reveal: fire once at 20% in view.
const reveal = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        reveal.unobserve(e.target);
      }
    }
  },
  { threshold: 0.2 },
);
document.querySelectorAll('[data-reveal]').forEach((el) => reveal.observe(el));

// Active section in the nav.
const links = new Map<string, HTMLElement[]>();
document.querySelectorAll<HTMLElement>('[data-nav-link]').forEach((a) => links.set(a.dataset.navLink!, [...(links.get(a.dataset.navLink!) ?? []), a]));
if (links.size) {
  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((group, id) => {
          group.forEach((a) => (id === e.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
        });
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  document.querySelectorAll('main section[id]').forEach((s) => spy.observe(s));
}

// Close the mobile menu after choosing a link.
const menu = document.getElementById('menu');
menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => (menu as HTMLElement).hidePopover?.()));

// Proof: one claim open at a time; the large figure follows it.
const bench = document.querySelector<HTMLElement>('[data-bench]');
if (bench) {
  const items = [...bench.querySelectorAll<HTMLDetailsElement>('details')];
  const fig = bench.querySelector<HTMLElement>('[data-bench-figure]');
  const unit = bench.querySelector<HTMLElement>('[data-bench-unit]');
  const status = bench.querySelector<HTMLElement>('[data-bench-status]');
  items.forEach((d) => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      items.forEach((o) => o !== d && (o.open = false));
      if (!fig || !unit || !status) return;
      fig.textContent = d.dataset.figure ?? '';
      unit.textContent = d.dataset.unit ?? '';
      const [mark, label, hue] = (d.dataset.status ?? '||').split('|');
      status.innerHTML = '';
      const m = document.createElement('span');
      m.className = 'mr-1.5';
      m.textContent = mark;
      status.append(m, label);
      const ink = `var(--c-${hue}-ink)`;
      status.style.color = ink;
      fig.style.color = ink;
      fig.classList.remove('swap');
      void fig.offsetWidth;
      fig.classList.add('swap');
    });
    const sum = d.querySelector('summary')!;
    // Keep one claim open: clicking the open one does nothing.
    sum.addEventListener('click', (e) => d.open && e.preventDefault());
    sum.addEventListener('keydown', (e) => {
      const i = items.indexOf(d);
      const to = e.key === 'ArrowDown' ? items[i + 1] : e.key === 'ArrowUp' ? items[i - 1] : null;
      if (!to) return;
      e.preventDefault();
      to.open = true;
      to.querySelector('summary')!.focus();
    });
  });
}

// Hero mesh: load after the page has settled so the headline stays the largest paint.
const mesh = document.querySelector<HTMLCanvasElement>('[data-membrane]');
if (mesh) {
  const start = () => {
    const run = () => import('./membrane').then((m) => m.mountMembrane(mesh, mesh.parentElement!, document.querySelector('[data-mesh-zone]')));
    'requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 1500 }) : setTimeout(run, 200);
  };
  document.readyState === 'complete' ? start() : addEventListener('load', start, { once: true });
}

// Masthead: a compact bar under the nav on every page; hovering spells the name out (a tap on phones). From tablet width, scrolling
// up at the very top of a page enlarges it to two rows (PUSHPAM and RAJ across the page, SATYARTHI under them) and scrolling down
// puts it back. The compact bar is plain CSS, so nothing here runs on first paint: this only animates the enlarged state.
const mast = document.querySelector<HTMLElement>('[data-mast]');
if (mast && window.matchMedia('(hover: none)').matches) mast.addEventListener('click', () => mast.classList.toggle('open'));
if (mast) {
  const spacer = document.querySelector<HTMLElement>('.mast-spacer')!;
  const row = mast.querySelector<HTMLElement>('[data-mast-row]')!;
  const cells = [...mast.querySelectorAll<HTMLElement>('.mast-cell')];
  const words = cells.map((c) => c.querySelector<HTMLElement>('.mast-word')!);
  const desk = window.matchMedia('(min-width: 768px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  let PULL = 80; // px of wheel travel between compact and enlarged: the same as the header grows, so it keeps pace with the page
  let pull = 0; // where the wheel has taken it: 0 compact .. PULL enlarged
  let e = 0; // what is on screen, easing towards pull / PULL
  let hv = 0; // 0 initials in their places .. 1 the name spelled out and, if it must, spread to fit
  let raf = 0;
  let snap = 0;
  let geo: { S: number; L: number[]; T: number; fs: number; em: number[]; gMax: number } | null = null;
  const spelled = () => mast.matches(':hover') || mast.classList.contains('open');

  const clear = () => {
    mast.style.removeProperty('height');
    spacer.style.removeProperty('height');
    document.documentElement.style.removeProperty('--bar-h');
    cells.forEach((c) => (c.style.transform = ''));
  };
  // Enlarging only scales the initials up where they stand (after harryjatkins.com). The name, once spelled out, stays on one line:
  // the words keep their places while they have room and spread evenly across the page only when they would otherwise collide.
  const apply = () => {
    if (!geo || e < 0.002) {
      if (e < 0.002) e = 0;
      clear();
      return;
    }
    const { S, L, T, fs, em, gMax } = geo;
    const sc = lerp(1, S, e);
    const w = em.map((m) => m * fs * sc);
    // Spelled out, each word keeps its place until the one before it would touch it, and is then pushed along, so nothing jumps as the
    // size changes. The gap between words widens with the size, which leaves them evenly spaced across the page at full size.
    const gap = lerp(12, gMax, e);
    const x1 = Math.max(L[1], w[0] + gap);
    const x2 = Math.max(L[2], x1 + w[1] + gap);
    const flow = [0, x1, x2];
    cells.forEach((c, i) => {
      c.style.transform = `translate(${lerp(L[i], flow[i], hv) - L[i]}px, 0) scale(${sc})`;
    });
    // Room under the letters for descenders (p, y, j) only grows as the name is spelled out, so enlarged initials sit snug.
    const h = T + fs * 0.74 * sc + fs * 0.22 * lerp(1, sc, hv) + 2.4;
    mast.style.height = `${h}px`;
    spacer.style.height = `${h}px`;
    document.documentElement.style.setProperty('--bar-h', `${h}px`);
  };
  // The picture follows the wheel through two soft filters in a row: it starts gently, glides, and settles without overshooting.
  let mid = 0;
  const tick = () => {
    raf = 0;
    const goal = pull / PULL;
    mid += (goal - mid) * 0.14;
    e += (mid - e) * 0.14;
    const hGoal = spelled() ? 1 : 0;
    hv += (hGoal - hv) * 0.14;
    const settled = Math.abs(goal - e) < 0.0015 && Math.abs(goal - mid) < 0.0015 && Math.abs(hGoal - hv) < 0.004;
    if (settled) {
      e = mid = goal;
      hv = hGoal;
    }
    apply();
    if (!settled) raf = requestAnimationFrame(tick);
  };
  const kick = () => {
    if (reduce.matches) {
      e = pull / PULL;
      hv = spelled() ? 1 : 0;
      apply();
    } else if (!raf) raf = requestAnimationFrame(tick);
  };
  const move = (to: number) => {
    if (!geo) return;
    pull = Math.min(PULL, Math.max(0, to));
    kick();
    // Let go half way and it settles to the nearer size.
    clearTimeout(snap);
    if (pull > 0 && pull < PULL) snap = window.setTimeout(() => move(pull > PULL / 2 ? PULL : 0), 900);
  };
  const measure = () => {
    if (!desk.matches || !words.every(Boolean)) {
      geo = null;
      pull = 0;
      e = 0;
      mid = 0;
      clear();
      return;
    }
    const W = row.clientWidth;
    const fs = parseFloat(getComputedStyle(words[0]).fontSize);
    const em = words.map((w) => w.offsetWidth / fs);
    // The big size is whatever lets the whole name sit on one line across the page.
    const f = Math.min(W / (em[0] + em[1] + em[2] + 0.5), 22 * 16);
    const S = Math.max(1, f / fs);
    PULL = Math.max(48, Math.round(cells[0].offsetTop + fs * 0.74 * S + fs * 0.22 - (cells[0].offsetTop + fs * 0.96 + 2.4)));
    pull = Math.min(pull, PULL);
    geo = { S, L: cells.map((c) => c.offsetLeft), T: cells[0].offsetTop, fs, em, gMax: Math.max(12, (W - (em[0] + em[1] + em[2]) * f) / 2) };
    apply();
  };
  new ResizeObserver(measure).observe(row);
  desk.addEventListener('change', measure);
  document.fonts?.ready.then(measure);
  mast.addEventListener('pointerenter', kick);
  mast.addEventListener('pointerleave', kick);
  mast.addEventListener('click', () => requestAnimationFrame(kick));
  measure();

  // At the very top, scrolling up pulls the header open and scrolling down pushes it shut again before the page moves.
  const lines = (ev: WheelEvent) => (ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaMode === 2 ? ev.deltaY * innerHeight : ev.deltaY);
  addEventListener('wheel', (ev) => {
    if (!geo || ev.ctrlKey) return;
    const dy = lines(ev);
    if (dy < 0 && window.scrollY <= 0) {
      ev.preventDefault();
      move(pull - dy);
    } else if (dy > 0 && pull > 0) {
      ev.preventDefault();
      move(pull - dy);
    }
  }, { passive: false });
  addEventListener('scroll', () => window.scrollY > 0 && pull > 0 && move(0), { passive: true });
  let touchY = 0;
  let touchPull = 0;
  addEventListener('touchstart', (ev) => {
    touchY = ev.touches[0].clientY;
    touchPull = pull;
  }, { passive: true });
  addEventListener('touchmove', (ev) => {
    if (!geo) return;
    const dy = ev.touches[0].clientY - touchY;
    if ((dy > 0 && window.scrollY <= 0) || (dy < 0 && pull > 0)) {
      if (ev.cancelable) ev.preventDefault();
      move(touchPull + dy);
    }
  }, { passive: false });
  addEventListener('keydown', (ev) => {
    if (!geo || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const k = ev.key;
    if ((k === 'ArrowUp' || k === 'PageUp' || k === 'Home') && window.scrollY <= 0) {
      ev.preventDefault();
      move(k === 'ArrowUp' ? pull + PULL / 2 : PULL);
    } else if (pull > 0 && (k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'End')) {
      ev.preventDefault();
      move(k === 'ArrowDown' ? pull - PULL / 2 : 0);
    }
  });
  // The strip is a second bar tucked behind the masthead (after harryjatkins.com, whose bar does the same: any scroll down tucks it
  // away, any scroll up brings it out, over 0.8s on cubic-bezier(0.83, 0, 0.17, 1), so reversing part-way leaves it half out).
  // At the top of the page it is always out.
  const strip = document.querySelector<HTMLElement>('[data-strip]');
  const stripSpacer = document.querySelector<HTMLElement>('.strip-spacer');
  if (strip && stripSpacer) {
    let H = 0; // height of the strip itself, without the part that sits behind the masthead
    let tucked = false;
    let last = window.scrollY;
    const place = (animate = true) => {
      if (!animate) strip.style.transition = 'none';
      strip.style.transform = tucked ? `translate3d(0, ${-H}px, 0)` : '';
      if (!animate) {
        void strip.offsetHeight;
        strip.style.transition = '';
      }
    };
    const set = (to: boolean) => {
      if (tucked === to) return;
      tucked = to;
      place();
    };
    const measureStrip = () => {
      if (!desk.matches) {
        tucked = false;
        strip.style.transform = '';
        stripSpacer.style.removeProperty('height');
        return;
      }
      const pad = parseFloat(getComputedStyle(strip).paddingTop);
      H = strip.offsetHeight - pad;
      stripSpacer.style.height = `${H}px`;
      place(false);
    };
    const hairline = () => strip.classList.toggle('is-scrolled', window.scrollY > 100);
    measureStrip();
    hairline();
    if (window.scrollY > 0 && desk.matches) {
      tucked = true;
      place(false);
    }
    new ResizeObserver(measureStrip).observe(strip);
    desk.addEventListener('change', measureStrip);
    document.fonts?.ready.then(measureStrip);
    addEventListener('scroll', () => {
      const y = window.scrollY;
      const d = y - last;
      last = y;
      hairline();
      if (!desk.matches) return;
      if (y <= 0) set(false);
      else if (d > 1) set(true);
      else if (d < -1) set(false);
    }, { passive: true });
    strip.addEventListener('focusin', () => set(false));
  }
  // A link to a section on this page closes it first, so the section lands where it should.
  document.addEventListener('click', (ev) => {
    if (e > 0 && (ev.target as Element).closest('a[href*="#"]')) {
      pull = 0;
      e = 0;
      mid = 0;
      clearTimeout(snap);
      apply();
    }
  }, true);
}

// Smooth anchor scrolling is switched on after load (see global.css).
const settle = () => requestAnimationFrame(() => root.classList.add('smooth'));
document.readyState === 'complete' ? settle() : addEventListener('load', settle, { once: true });

// Closing a project returns to the exact place in the index when the visitor came from it; otherwise the link goes to #projects.
document.querySelector<HTMLAnchorElement>('.close-btn')?.addEventListener('click', (e) => {
  try {
    const from = new URL(document.referrer);
    if (from.origin === location.origin && from.pathname === '/' && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  } catch {
    /* no referrer: follow the link */
  }
});
