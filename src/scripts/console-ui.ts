import { formatFooter } from '~/lib/format';
import { assertReadOnly } from '~/lib/sql-guard';
import { renderHead, renderInto } from '~/scripts/render-result';
import type { Engine } from '~/scripts/console-engine';

const editor = document.querySelector<HTMLTextAreaElement>('#console-editor');
const runBtn = document.querySelector<HTMLButtonElement>('#console-run');
const head = document.querySelector<HTMLElement>('#console-head');
const body = document.querySelector<HTMLElement>('#console-body');
const footer = document.querySelector<HTMLElement>('#console-footer');
const errorBox = document.querySelector<HTMLElement>('#console-error');
const live = document.querySelector<HTMLElement>('#console-status');
const fallback = document.querySelector<HTMLElement>('#console-fallback');

function announce(message: string): void {
  if (live) live.textContent = message;
}

function showError(message: string): void {
  // Clear the previous result alongside the error. Leaving a stale table and
  // its "N rows in set" footer beside an error message invites the reader to
  // believe those rows answered the query that just failed.
  head?.replaceChildren();
  body?.replaceChildren();
  if (footer) footer.textContent = '';
  if (!errorBox) return;
  errorBox.textContent = message;
  errorBox.hidden = false;
  announce(message);
}

function clearError(): void {
  if (!errorBox) return;
  errorBox.textContent = '';
  errorBox.hidden = true;
}

if (editor && runBtn && head && body && footer) {
  // The static fallback is the no-JavaScript view. Once the console can run,
  // it stops being the answer and becomes noise.
  fallback?.setAttribute('hidden', '');

  let engine: Engine | null = null;
  let running = false;

  async function run(): Promise<void> {
    if (running) return;
    const sql = editor!.value;

    try {
      assertReadOnly(sql);
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
      return;
    }

    running = true;
    runBtn!.disabled = true;
    clearError();
    footer!.textContent = engine ? 'Running…' : 'Starting the database…';
    announce(footer!.textContent);

    try {
      if (!engine) {
        const { initEngine } = await import('~/scripts/console-engine');
        engine = await initEngine();
      }
      const result = await engine.query(sql);
      renderHead(head!, result.columns);
      renderInto(body!, result);
      footer!.textContent =
        formatFooter(result.rows.length, result.seconds) +
        (result.truncated ? ', truncated' : '');
      announce(`${result.rows.length} rows returned.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showError(message);
      // A cancelled query is only cancelled from our side — DuckDB is still
      // working in its worker, and every later query would queue behind it.
      // Drop the engine so the next Run starts a clean one.
      if (/cancelled/i.test(message) && engine) {
        const stale = engine;
        engine = null;
        void stale.close().catch(() => {});
      }
    } finally {
      running = false;
      runBtn!.disabled = false;
    }
  }

  runBtn.addEventListener('click', run);

  editor.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void run();
    }
    if (e.key === 'Escape') {
      // Focus leaves the editor rather than being trapped in it, so keyboard
      // users can tab past the console instead of through it.
      e.preventDefault();
      runBtn.focus();
    }
  });

  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-example-sql]')) {
    btn.addEventListener('click', () => {
      editor.value = btn.dataset.exampleSql ?? '';
      clearError();
      editor.focus();
    });
  }
}
