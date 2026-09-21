import { getCollection } from 'astro:content';

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

/** Astro's `reference()` stores the target as `{ id, collection }`. */
const ref = (v: unknown): string | null =>
  v && typeof v === 'object' && 'id' in v ? String((v as { id: string }).id) : null;

export async function buildWarehouse(): Promise<Warehouse> {
  const [orgs, people, skills, projects, credentials, claims, roles, testimonials] =
    await Promise.all([
      getCollection('orgs'), getCollection('people'), getCollection('skills'),
      getCollection('projects'), getCollection('credentials'), getCollection('claims'),
      getCollection('roles'), getCollection('testimonials'),
    ]);

  const dim_project: Row[] = projects
    .sort((a, b) => a.data.order - b.data.order)
    .map((p) => ({
      project_id: p.id,
      name: p.data.name,
      codename: p.data.codename,
      year: p.data.year,
      context: p.data.context,
      org_id: ref(p.data.org),
      repo_url: p.data.repo_url,
      live_url: p.data.live_url,
      status: p.data.status,
      summary: p.data.summary,
    }));

  const fact_contribution: Row[] = projects.flatMap((p) =>
    p.data.skills.map((s) => ({
      project_id: p.id,
      skill_id: ref(s),
      is_primary: p.data.stack.some((t) => t.toLowerCase() === ref(s)?.toLowerCase()),
    })),
  );

  return {
    dim_org: orgs.map((o) => ({
      org_id: o.id, name: o.data.name, kind: o.data.kind, location: o.data.location,
    })),
    dim_person: people.map((p) => ({
      person_id: p.id, name: p.data.name, title: p.data.title,
      org_id: ref(p.data.org), profile_url: p.data.profile_url,
    })),
    dim_skill: skills.map((s) => ({
      skill_id: s.id, name: s.data.name, category: s.data.category,
      first_used_on: s.data.first_used_on,
    })),
    dim_project,
    dim_credential: credentials.map((c) => ({
      credential_id: c.id, name: c.data.name, issuer_id: ref(c.data.issuer),
      issued_on: c.data.issued_on, verify_url: c.data.verify_url, track: c.data.track,
    })),
    fact_claim: claims.map((c) => ({
      claim_id: c.id,
      project_id: ref(c.data.project),
      metric: c.data.metric,
      value: c.data.value,
      unit: c.data.unit,
      verification: c.data.verification,
      method: c.data.method,
      caveat: c.data.caveat,
      source_url: c.data.source_url,
      evidence: c.data.evidence,
    })),
    fact_contribution,
    fact_role: roles.map((r) => ({
      role_id: r.id, org_id: ref(r.data.org), title: r.data.title,
      started_on: r.data.started_on, ended_on: r.data.ended_on, summary: r.data.summary,
    })),
    fact_testimonial: testimonials.map((t) => ({
      testimonial_id: t.id, person_id: ref(t.data.person), body: t.data.body,
      given_on: t.data.given_on, source_url: t.data.source_url,
    })),
  };
}
