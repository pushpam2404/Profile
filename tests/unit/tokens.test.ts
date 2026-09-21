import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/theme.css', 'utf8');

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
      expect(css).toContain(`${token}: ${hex}`);
    }
  });

  it('binds exactly two font families and no sans-serif', () => {
    expect(css).toContain('--font-prose');
    expect(css).toContain('--font-data');
    expect(css).toContain('Newsreader');
    expect(css).toContain('IBM Plex Mono');
    expect(css).not.toMatch(/--font-sans|Inter|Helvetica Neue/);
  });
});
