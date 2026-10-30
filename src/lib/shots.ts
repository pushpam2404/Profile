import type { ImageMetadata } from 'astro';

// Screenshots live in src/assets/projects/<project id>/ and are listed, in order, in the project's YAML.
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/projects/*/*.{png,jpg,webp}', { eager: true });

export type Shot = { img: ImageMetadata; alt: string; aspect: number };

export function shotsFor(id: string, shots: { file: string; alt: string }[]): Shot[] {
  return shots.map((s) => {
    const m = files[`../assets/projects/${id}/${s.file}`]?.default;
    if (!m) throw new Error(`Missing screenshot ${id}/${s.file}`);
    return { img: m, alt: s.alt, aspect: m.width / m.height };
  });
}

// Lay the extra screenshots out as rows of equal height (a justified gallery): each shot keeps its own proportions,
// so nothing is cropped, and a phone screenshot sits beside a desktop one at the same height.
export function packRows(rest: Shot[], target = 2.05): Shot[][] {
  const rows: Shot[][] = [];
  let row: Shot[] = [];
  let sum = 0;
  for (const s of rest) {
    row.push(s);
    sum += s.aspect;
    if (sum >= target) {
      rows.push(row);
      row = [];
      sum = 0;
    }
  }
  // A short last row would leave a gap beside it: fold it into the row above so every row spans the full width.
  if (row.length && sum < target * 0.6 && rows.length) rows[rows.length - 1].push(...row);
  else if (row.length) rows.push(row);
  return rows;
}
