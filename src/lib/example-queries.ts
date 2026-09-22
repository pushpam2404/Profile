export interface ExampleQuery {
  title: string;
  sql: string;
}

/**
 * Seeds for a reader who does not write SQL. Each one answers a question the
 * site actually makes a point of — including the two that are unflattering.
 */
export const EXAMPLE_QUERIES: ExampleQuery[] = [
  {
    title: 'What has been independently verified?',
    sql: `SELECT metric, value, source_url
  FROM fact_claim
 WHERE verification = 'verified'`,
  },
  {
    title: 'What was built but never proven?',
    sql: `SELECT p.name, c.metric, c.caveat
  FROM fact_claim c
  JOIN dim_project p USING (project_id)
 WHERE c.verification = 'untested'`,
  },
  {
    title: 'Which skills have shipped in more than one project?',
    sql: `SELECT s.name, count(*) AS projects
  FROM fact_contribution f
  JOIN dim_skill s USING (skill_id)
 GROUP BY 1 HAVING count(*) > 1
 ORDER BY 2 DESC`,
  },
  {
    title: 'Every claim, by how well it is backed',
    sql: `SELECT verification, count(*) AS claims
  FROM fact_claim
 GROUP BY 1 ORDER BY 2 DESC`,
  },
];
