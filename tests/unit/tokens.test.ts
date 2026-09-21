import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const themeCss = readFileSync('src/styles/theme.css', 'utf8');
const globalCss = readFileSync('src/styles/global.css', 'utf8');

describe('design tokens', () => {
  it('defines the greenbar ground and the four status hues', () => {
    const required: Record<string, string> = {
      '--color-paper': '#EDEFEA',
      '--color-bar': '#E2E8DD',
      '--color-rule': '#C9D0C6',
      '--color-ink': '#16231D',
      '--color-ink-soft': '#4A5A52',
      '--color-verified': '#0F6E63',
      '--color-measured': '#2E4A63',
      '--color-reported': '#9A6B1F',
      '--color-untested': '#8C3A2B',
    };
    for (const [token, hex] of Object.entries(required)) {
      expect(themeCss).toContain(`${token}: ${hex}`);
    }
  });

  it('binds exactly two font families and no sans-serif', () => {
    expect(themeCss).toContain('--font-prose');
    expect(themeCss).toContain('--font-data');
    expect(themeCss).toContain('Newsreader');
    expect(themeCss).toContain('IBM Plex Mono');
    expect(themeCss).not.toMatch(/--font-sans|Inter|Helvetica Neue/);
  });

  it('keeps verification-status hues out of non-status styles', () => {
    expect(themeCss).toContain('--color-focus');
    // The four status hues are the site's legend. global.css holds non-status UI
    // rules, so a reference to one here means a control is signalling a meaning
    // it does not have — which is exactly how the focus ring regressed.
    expect(globalCss).not.toMatch(/var\(--color-(verified|measured|reported|untested)\)/);
  });

  it('gives the focus ring its own non-legend token', () => {
    const focusRule = globalCss.match(/:focus-visible\s*\{[^}]*\}/)?.[0] ?? '';
    expect(focusRule).toContain('var(--color-focus)');
  });
});
