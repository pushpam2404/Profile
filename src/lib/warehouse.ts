import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { load as parseYaml } from 'js-yaml';

const CONTENT = 'src/content';

const readJson = <T>(file: string): T[] =>
  JSON.parse(readFileSync(join(CONTENT, file), 'utf8')) as T[];

/** Project frontmatter, read without Astro so this works under plain Node. */
function readProjects(): Record<string, unknown>[] {
  const dir = join(CONTENT, 'projects');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = readFileSync(join(dir, f), 'utf8');
      const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
      if (!m) throw new Error(`${f} has no frontmatter block`);
      return { id: f.replace(/\.md$/, ''), ...(parseYaml(m[1]!) as object) };
    });
}

export type Row = Record<string, string | number | boolean | null>;

export interface Warehouse {
  dim_org: Row[];
  dim_person: Row[];
  dim_skill: Row[];
  dim_project: Row[];
  dim_credential: Row[];
  fact_claim: Row[];
  fact_contribution: Row[];
  fact_role: Row[];
  fact_testimonial: Row[];
}

export const TABLE_NAMES = [
  'dim_org', 'dim_person', 'dim_skill', 'dim_project', 'dim_credential',
  'fact_claim', 'fact_contribution', 'fact_role', 'fact_testimonial',
] as const satisfies readonly (keyof Warehouse)[];

/**
 * In the JSON and frontmatter, a reference is written as a bare id string.
 * Astro wraps it as `{ id, collection }` on its own read path; this one does not,
 * so accept either shape rather than assuming.
 */
const ref = (v: unknown): string | null => {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  return typeof v === 'object' && 'id' in v ? String((v as { id: string }).id) : null;
};

export async function buildWarehouse(): Promise<Warehouse> {
  const orgs = readJson<Row>('orgs.json');
  const people = readJson<Row>('people.json');
  const skills = readJson<Row>('skills.json');
  const credentials = readJson<Row>('credentials.json');
  const claims = readJson<Row>('claims.json');
  const roles = readJson<Row>('roles.json');
  const testimonials = readJson<Row>('testimonials.json');
  const projects = readProjects() as Record<string, any>[];

  const dim_project: Row[] = projects
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map((p) => ({
      project_id: String(p.id),
      name: p.name,
      codename: p.codename ?? null,
      year: p.year,
      context: p.context,
      org_id: ref(p.org),
      repo_url: p.repo_url ?? null,
      live_url: p.live_url ?? null,
      status: p.status,
      summary: p.summary,
    }));

  const fact_contribution: Row[] = projects.flatMap((p) =>
    (p.skills as unknown[]).map((s) => ({
      project_id: String(p.id),
      skill_id: ref(s),
      is_primary: (p.stack as string[]).some(
        (t) => t.toLowerCase() === ref(s)?.toLowerCase(),
      ),
    })),
  );

  return {
    dim_org: orgs.map((o: any) => ({
      org_id: o.id, name: o.name, kind: o.kind, location: o.location ?? null,
    })),
    dim_person: people.map((p: any) => ({
      person_id: p.id, name: p.name, title: p.title,
      org_id: ref(p.org), profile_url: p.profile_url ?? null,
    })),
    dim_skill: skills.map((s: any) => ({
      skill_id: s.id, name: s.name, category: s.category,
      first_used_on: s.first_used_on,
    })),
    dim_project,
    dim_credential: credentials.map((c: any) => ({
      credential_id: c.id, name: c.name, issuer_id: ref(c.issuer),
      issued_on: c.issued_on, verify_url: c.verify_url, track: c.track ?? null,
    })),
    fact_claim: claims.map((c: any) => ({
      claim_id: c.id,
      project_id: ref(c.project),
      metric: c.metric,
      value: c.value ?? null,
      unit: c.unit ?? null,
      verification: c.verification,
      method: c.method ?? null,
      caveat: c.caveat ?? null,
      source_url: c.source_url ?? null,
      evidence: c.evidence ?? null,
    })),
    fact_contribution,
    fact_role: roles.map((r: any) => ({
      role_id: r.id, org_id: ref(r.org), title: r.title,
      started_on: r.started_on, ended_on: r.ended_on ?? null, summary: r.summary,
    })),
    fact_testimonial: testimonials.map((t: any) => ({
      testimonial_id: t.id, person_id: ref(t.person), body: t.body,
      given_on: t.given_on, source_url: t.source_url,
    })),
  };
}
