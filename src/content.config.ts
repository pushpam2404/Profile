import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

export const VERIFICATION = ['verified', 'measured', 'self_reported', 'untested'] as const;
export type Verification = (typeof VERIFICATION)[number];

/**
 * A claim may not be stated without the evidence its status demands.
 * These refinements are the site's thesis expressed as a build gate (spec §3).
 */
export const claimSchema = z
  .object({
    metric: z.string().min(1),
    value: z.string().nullable(),
    unit: z.string().nullable(),
    verification: z.enum(VERIFICATION),
    method: z.string().nullable(),
    caveat: z.string().nullable(),
    source_url: z.string().url().nullable(),
    evidence: z.string().nullable(),
  })
  .superRefine((c, ctx) => {
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });

    if (c.verification === 'verified' && !c.source_url) {
      fail('source_url', 'A verified claim needs a public URL the reader can open.');
    }
    if (c.verification === 'measured') {
      if (!c.method) fail('method', 'A measured claim must state hardware, dataset and procedure.');
      if (!c.caveat) fail('caveat', 'A measured claim must state what the number does not prove.');
    }
    if (c.verification === 'untested' && !c.caveat) {
      fail('caveat', 'An untested claim must state what proving it would require.');
    }
    if (c.verification === 'untested' && c.value !== null) {
      fail('value', 'An untested claim has no value. Use null.');
    }
  });

const orgs = defineCollection({
  loader: file('src/content/orgs.json'),
  schema: z.object({
    name: z.string(),
    kind: z.enum(['employer', 'university', 'club', 'agency', 'issuer']),
    location: z.string().nullable(),
  }),
});

const people = defineCollection({
  loader: file('src/content/people.json'),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    org: reference('orgs'),
    profile_url: z.string().url().nullable(),
  }),
});

const skills = defineCollection({
  loader: file('src/content/skills.json'),
  schema: z.object({
    name: z.string(),
    category: z.enum([
      'language', 'data-engineering', 'database', 'machine-learning',
      'framework', 'cloud', 'tool', 'concept',
    ]),
    first_used_on: z.string().regex(/^\d{4}-\d{2}$/),
  }),
});

const credentials = defineCollection({
  loader: file('src/content/credentials.json'),
  schema: z.object({
    name: z.string(),
    issuer: reference('orgs'),
    issued_on: z.string().regex(/^\d{4}-\d{2}$/),
    verify_url: z.string().url(),
    track: z.string().nullable(),
  }),
});

const roles = defineCollection({
  loader: file('src/content/roles.json'),
  schema: z.object({
    org: reference('orgs'),
    title: z.string(),
    started_on: z.string().regex(/^\d{4}-\d{2}$/),
    ended_on: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
    summary: z.string(),
  }),
});

const testimonials = defineCollection({
  loader: file('src/content/testimonials.json'),
  schema: z.object({
    person: reference('people'),
    body: z.string().min(1),
    given_on: z.string().regex(/^\d{4}-\d{2}$/),
    source_url: z.string().url(),
  }),
});

const claims = defineCollection({
  loader: file('src/content/claims.json'),
  schema: claimSchema.and(z.object({ project: reference('projects').optional() })),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    codename: z.string().nullable(),
    year: z.number().int(),
    context: z.string(),
    org: reference('orgs').optional(),
    repo_url: z.string().url().nullable(),
    live_url: z.string().url().nullable(),
    status: z.enum(['shipped', 'prototype', 'active-development', 'archived']),
    summary: z.string().min(1),
    stack: z.array(z.string()).min(1),
    skills: z.array(reference('skills')).min(1),
    order: z.number().int(),
  }),
});

export const collections = {
  orgs, people, skills, credentials, roles, testimonials, claims, projects,
};
