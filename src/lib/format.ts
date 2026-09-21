export function formatFooter(rows: number, seconds: number): string {
  const noun = rows === 1 ? 'row' : 'rows';
  return `${rows} ${noun} in set (${seconds.toFixed(3)} s)`;
}

export function formatValue(value: string | null, unit: string | null): string {
  if (value === null) return 'NULL';
  return unit ? `${value} ${unit}` : value;
}
