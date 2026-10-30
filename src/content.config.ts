import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One file per project. The schema is the "invent nothing" guard: every public
// claim must live in a field, and a missing link is `null` (a visible TODO in the
// YAML), never a made-up URL.
const projects = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    tagline: z.string(),
    context: z.string(),
    role: z.string(),
    status: z.enum(['live', 'in-development', 'prototype', 'code-only', 'no-public-repo']),
    badge: z.string().optional(),
    // Each project owns one hue from the palette in global.css (card rule, number, chips, spec sheet).
    color: z.enum(['red', 'teal', 'amber', 'violet', 'green', 'blue']),
    // Real screenshots in src/assets/projects/<id>/, in display order. The first one is the card cover.
    shots: z.array(z.object({ file: z.string(), alt: z.string() })).default([]),
    // For a project with no interface: an excerpt of its real source, shown where a screenshot would be.
    snippet: z.object({ file: z.string(), lines: z.string(), code: z.string() }).optional(),
    stack: z.array(z.string()).min(1),
    points: z.array(z.string()).min(1),
    limits: z.array(z.string()).default([]),
    facts: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    links: z.object({
      repo: z.url().nullable(),
      live: z.url().nullable(),
    }),
  }),
});

export const collections = { projects };
