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
    const state = b.querySelector('[data-mode-state]');
    if (state) state.textContent = on ? '( Y )' : '( N )';
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
const links = new Map<string, HTMLElement>();
document.querySelectorAll<HTMLElement>('[data-nav-link]').forEach((a) => links.set(a.dataset.navLink!, a));
if (links.size) {
  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a, id) => {
          if (id === e.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
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

// Masthead: a compact bar under the nav on every page; hovering spells the name out. Touch screens have no hover, so a tap
// spells it out and another tap puts it away.
const mast = document.querySelector<HTMLElement>('[data-mast]');
if (mast && window.matchMedia('(hover: none)').matches) mast.addEventListener('click', () => mast.classList.toggle('open'));

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
