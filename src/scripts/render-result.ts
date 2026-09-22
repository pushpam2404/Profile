import type { QueryResult } from './console-engine';

/**
 * DuckDB infers whole numbers as BIGINT, so integer columns arrive as JS
 * bigint rather than number. Both are numeric for alignment purposes.
 */
function isNumeric(v: unknown): boolean {
  return typeof v === 'number' || typeof v === 'bigint';
}

export function cellText(v: unknown): string {
  return v === null || v === undefined ? 'NULL' : String(v);
}

const STATUS_LABEL: Record<string, string> = {
  verified: 'verified',
  measured: 'measured',
  self_reported: 'self-reported',
  untested: 'untested',
};

/**
 * A verification value carries the site's legend, so a live result must render
 * it the way StatusTag does rather than as bare text — otherwise swapping the
 * static hero for live output silently drops the colour encoding.
 */
function statusSpan(value: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = `status status--${value}`;
  span.dataset.status = value;
  span.textContent = STATUS_LABEL[value] ?? value;
  return span;
}

function link(href: string, label: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.rel = 'noopener';
  a.textContent = label;
  return a;
}

export interface RenderOptions {
  /** Column whose value renders as a StatusTag rather than bare text. */
  statusColumn?: string;
  /**
   * When set, a `*_url` column is folded into the preceding cell as a link with
   * this label instead of getting a column of its own. The hero needs this: its
   * static markup puts a "check" link beside the status, and a live result that
   * dropped it would lose the affordance the whole site exists to offer.
   */
  foldUrlInto?: { column: string; label: string };
}

/** Builds rows with textContent only — never innerHTML (spec §7). */
export function renderInto(
  tbody: HTMLElement,
  result: QueryResult,
  options: RenderOptions = {},
): void {
  const { statusColumn = 'verification', foldUrlInto } = options;
  const statusIndex = result.columns.indexOf(statusColumn);
  const foldIndex = foldUrlInto ? result.columns.indexOf(foldUrlInto.column) : -1;

  tbody.replaceChildren();
  for (const row of result.rows) {
    const tr = document.createElement('tr');
    row.forEach((cell, i) => {
      if (i === foldIndex) return; // rendered inside an earlier cell
      const td = document.createElement('td');
      if (i === statusIndex && typeof cell === 'string' && cell in STATUS_LABEL) {
        td.appendChild(statusSpan(cell));
        const url = foldIndex >= 0 ? row[foldIndex] : null;
        if (typeof url === 'string' && url) {
          td.append(' ', link(url, foldUrlInto!.label));
        }
      } else if (typeof cell === 'string' && /^https?:\/\//.test(cell)) {
        td.appendChild(link(cell, cell));
      } else {
        td.textContent = cellText(cell);
        if (isNumeric(cell)) td.className = 'numeric';
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
}

export function renderHead(thead: HTMLElement, columns: string[]): void {
  thead.replaceChildren();
  const tr = document.createElement('tr');
  for (const name of columns) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = name;
    tr.appendChild(th);
  }
  thead.appendChild(tr);
}
