/**
 * The warehouse is public, static and read-only, so this is not a security
 * boundary — there is nothing here to protect. It exists so a reader who types
 * something the console cannot run gets a sentence explaining why, rather than
 * a DuckDB parser error.
 */
export function assertReadOnly(sql: string): void {
  const trimmed = sql.trim().replace(/;\s*$/, '');
  if (trimmed === '') throw new Error('Nothing to run yet.');
  if (trimmed.includes(';')) throw new Error('One statement at a time.');
  if (!/^(select|with)\b/i.test(trimmed)) {
    throw new Error('Only SELECT is available here.');
  }
}
