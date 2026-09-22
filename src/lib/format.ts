import type { Row } from '~/lib/warehouse';

export function formatFooter(rows: number, seconds: number): string {
  const noun = rows === 1 ? 'row' : 'rows';
  return `${rows} ${noun} in set (${seconds.toFixed(3)} s)`;
}

export function formatValue(value: string | null, unit: string | null): string {
  if (value === null) return 'NULL';
  return unit ? `${value} ${unit}` : value;
}

const escape = (v: Row[string]): string => {
  if (v === null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

export function toCsv(rows: Row[]): string {
  const first = rows[0];
  if (!first) return '';
  const keys = Object.keys(first);
  const head = keys.join(',');
  const body = rows.map((r) => keys.map((k) => escape(r[k] ?? null)).join(','));
  return [head, ...body].join('\n');
}
