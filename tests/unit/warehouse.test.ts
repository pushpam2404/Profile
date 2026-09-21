import { describe, it, expect } from 'vitest';
import { buildWarehouse, TABLE_NAMES, type Warehouse } from '~/lib/warehouse';

const wh = await buildWarehouse();

const COLUMNS: Record<keyof Warehouse, string[]> = {
  dim_org: ['org_id', 'name', 'kind', 'location'],
  dim_person: ['person_id', 'name', 'title', 'org_id', 'profile_url'],
  dim_skill: ['skill_id', 'name', 'category', 'first_used_on'],
  dim_project: [
    'project_id', 'name', 'codename', 'year', 'context', 'org_id',
    'repo_url', 'live_url', 'status', 'summary',
  ],
  dim_credential: [
    'credential_id', 'name', 'issuer_id', 'issued_on', 'verify_url', 'track',
  ],
  fact_claim: [
    'claim_id', 'project_id', 'metric', 'value', 'unit', 'verification',
    'method', 'caveat', 'source_url', 'evidence',
  ],
  fact_contribution: ['project_id', 'skill_id', 'is_primary'],
  fact_role: [
    'role_id', 'org_id', 'title', 'started_on', 'ended_on', 'summary',
  ],
  fact_testimonial: [
    'testimonial_id', 'person_id', 'body', 'given_on', 'source_url',
  ],
};

describe('warehouse', () => {
  it('emits every declared table, none empty', () => {
    for (const t of TABLE_NAMES) expect(wh[t].length).toBeGreaterThan(0);
  });

  it('keeps referential integrity on fact_claim.project_id', () => {
    const ids = new Set(wh.dim_project.map((p) => p.project_id));
    for (const c of wh.fact_claim) {
      if (c.project_id !== null) expect(ids.has(c.project_id)).toBe(true);
    }
  });

  it('keeps referential integrity on fact_contribution', () => {
    const projects = new Set(wh.dim_project.map((p) => p.project_id));
    const skills = new Set(wh.dim_skill.map((s) => s.skill_id));
    for (const f of wh.fact_contribution) {
      expect(projects.has(f.project_id)).toBe(true);
      expect(skills.has(f.skill_id)).toBe(true);
    }
  });

  // Astro logs a broken reference() id as an error but still exits 0, so the
  // build is NOT the referential-integrity gate. This test is.
  it('resolves every foreign key in the warehouse', () => {
    const keyed = (rows: typeof wh.dim_org, k: string) => new Set(rows.map((r) => r[k]));
    const orgs = keyed(wh.dim_org, 'org_id');
    const people = keyed(wh.dim_person, 'person_id');
    const projects = keyed(wh.dim_project, 'project_id');

    const edges: [string, unknown[], Set<unknown>][] = [
      ['dim_person.org_id', wh.dim_person.map((r) => r.org_id), orgs],
      ['dim_project.org_id', wh.dim_project.map((r) => r.org_id), orgs],
      ['dim_credential.issuer_id', wh.dim_credential.map((r) => r.issuer_id), orgs],
      ['fact_role.org_id', wh.fact_role.map((r) => r.org_id), orgs],
      ['fact_testimonial.person_id', wh.fact_testimonial.map((r) => r.person_id), people],
      ['fact_claim.project_id', wh.fact_claim.map((r) => r.project_id), projects],
    ];

    for (const [label, values, valid] of edges) {
      for (const v of values) {
        if (v === null) continue;
        expect(valid.has(v), `${label} points at missing id: ${String(v)}`).toBe(true);
      }
    }
  });

  it('carries method and caveat on every measured claim', () => {
    for (const c of wh.fact_claim.filter((r) => r.verification === 'measured')) {
      expect(c.method).toBeTruthy();
      expect(c.caveat).toBeTruthy();
    }
  });

  it('never mentions the excluded project', () => {
    const blob = JSON.stringify(wh).toLowerCase();
    for (const banned of ['drdo', 'lidar', 'jetson']) expect(blob).not.toContain(banned);
  });

  it('emits exactly the declared columns, with no undefined values', () => {
    for (const table of TABLE_NAMES) {
      const expected = COLUMNS[table];
      for (const row of wh[table]) {
        // A reader typo (p.sumary for p.summary) yields undefined, which tsc
        // cannot catch through the any-typed JSON reads. This is that guard.
        expect(Object.keys(row).sort()).toEqual([...expected].sort());
        for (const [key, value] of Object.entries(row)) {
          expect(value, `${table}.${key} is undefined`).not.toBeUndefined();
        }
      }
    }
  });
});
