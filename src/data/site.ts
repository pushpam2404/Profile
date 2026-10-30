// Single source of truth for everything that is not a project. Gaps are marked TODO.
export const site = {
  name: 'Pushpam Raj Satyarthi',
  short: 'Pushpam',
  role: 'Software Developer',
  url: 'https://pushpam2404-profile.vercel.app',
  location: 'Visakhapatnam, India',
  email: 'prsatyarthi2404@gmail.com',
  phone: '+91 93425 13321',
  phoneHref: 'tel:+919342513321',
  github: 'https://github.com/pushpam2404',
  linkedin: 'https://www.linkedin.com/in/pushpamrajsatyarthi/',
  // TODO: add the resume PDF to /public and set this to its path to show a download link.
  resume: null as string | null,
  description:
    'Portfolio of Pushpam Raj Satyarthi, a third-year CSE student at GITAM University who builds backend systems, data pipelines and web apps with Python, SQL, Node.js and TypeScript.',
};

export const nav = [
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'projects', label: 'Projects' },
  { id: 'proof', label: 'Proof' },
  { id: 'contact', label: 'Contact' },
] as const;

export const heroStats = [
  { value: '9.17', label: 'CGPA at GITAM' },
  { value: '101,302', label: 'labeled accounts in the fake-account training data' },
  { value: '9', label: 'REST endpoints shipped at Motherson' },
  { value: '2', label: 'Smart India Hackathon internal-round qualifiers' },
];

export const about = {
  paragraphs: [
    'I am a third-year B.Tech Computer Science student at GITAM University in Visakhapatnam. I like building software end to end: the backends and APIs, the data that moves through them, and the interfaces people use.',
    'I started in C and C++ and moved toward backends and data systems, because good logic is not much use on top of broken data. I still care about efficiency and memory. These days that means FastAPI and Node.js services, PostgreSQL and MongoDB, ETL pipelines in Python, and React, TypeScript and WebGL on the front.',
    'In summer 2026 I interned on the AIML team at Motherson Technology Services, where I built the chat-history storage layer for LegalLens, an AI legal research platform.',
  ],
  openTo: 'Open to software engineering and data internships.',
  learning: 'Learning now: Airflow, star-schema design, incremental ETL, and more FastAPI and PostgreSQL.',
};

export const layers = [
  { id: 'interfaces', title: 'Interfaces', items: ['React', 'TypeScript', 'WebGL'], desc: 'Screens people use, from a dashboard to a 3D music map.', project: { slug: 'astra-3d-music-universe', name: 'Astra' } },
  { id: 'services', title: 'Services', items: ['FastAPI', 'Node.js', 'Express'], desc: 'APIs that sit between the screen and the data: auth, validation, queries.', project: { slug: 'kaps-medtech', name: 'KAPS MedTech' } },
  { id: 'data', title: 'Data', items: ['PostgreSQL', 'MongoDB', 'ETL'], desc: 'Schemas, stores and the pipelines that keep them clean.', project: { slug: 'global-banking-etl', name: 'Global banking ETL' } },
];

export const pipeline = [
  { id: 'sources', title: 'Sources', desc: 'Relational databases read incrementally by timestamp, JSON APIs pulled with retries and backoff, and raw files from object storage.', note: 'PostgreSQL · JSON · CSV' },
  { id: 'transform', title: 'Transform and validate', desc: 'Cleans and normalizes incoming data, checks types and flags outliers with vectorized Pandas and NumPy operations.', note: 'Pandas · NumPy' },
  { id: 'warehouse', title: 'Warehouse', desc: 'Loads with UPSERTs so reruns do not create duplicates, into a schema normalized to 3NF.', note: 'PostgreSQL' },
];

export const experience = [
  {
    org: 'Motherson Technology Services Limited',
    role: 'Software Engineering Intern, AIML team',
    product: 'LegalLens, an AI-powered legal research and document analysis platform',
    period: 'May 2026 – June 2026',
    place: 'Hyderabad, India',
    points: [
      'Designed and built a hybrid persistence layer: SQLite for conversation metadata and Azure Blob Storage for full message payloads, shipped across a FastAPI backend and three React and TypeScript frontend modules.',
      'Isolated storage per feature mode (Analysis Engine, Research Assistant, Draft Builder) so each mode can search, restore and archive its own sessions without cross-module contamination.',
      'Wrote a 316-line FastAPI module (chat_history.py) from scratch with 9 CRUD endpoints for conversation recovery, archive and unarchive, title search and message save, coordinating Azure Blob writes with SQLite metadata tracking.',
      'Audited the codebase and documented 14+ bugs, among them silent state wipes on error, a SQLite threading bug under concurrent load, and navigation into the wrong workspace, and produced a 27-entry bug tracker.',
      'Did QA independently and submitted code for senior review before merging.',
    ],
    meta: [
      { k: 'Languages', v: 'Python, TypeScript' },
      { k: 'Backend', v: 'FastAPI' },
      { k: 'Metadata', v: 'SQLite' },
      { k: 'Payloads', v: 'Azure Blob Storage' },
      { k: 'Module', v: '316 lines' },
      { k: 'Endpoints', v: '9 CRUD routes' },
    ],
  },
];

export const education = {
  school: 'GITAM University',
  place: 'Visakhapatnam, India',
  degree: 'B.Tech in Computer Science and Engineering',
  period: '2024 – 2028',
  cgpa: '9.17',
  coursework: [
    'Database Management Systems',
    'Design and Analysis of Algorithms',
    'Data Structures',
    'Operating Systems',
    'Data Warehousing and Mining',
    'Computer Networks',
    'Machine Learning Techniques',
    'Probability and Statistics for Engineering',
  ],
};

export const certifications = {
  program: 'IBM Data Engineering Professional Certificate',
  issuer: 'IBM on Coursera',
  blurb:
    'A 16-course program covering ETL with Airflow and Kafka, SQL and relational databases, Linux shell scripting, data warehousing, NoSQL, big data with Spark and Hadoop, and BI dashboards.',
  // `when` is the month on the LinkedIn credential. The courses without one are completed, with certificates in hand, but not uploaded to LinkedIn yet.
  earnedCount: 16,
  courses: [
    { name: 'Introduction to Data Engineering', when: null },
    { name: 'Python for Data Science, AI and Development', when: null },
    { name: 'Python Project for Data Engineering', when: 'Oct 2025' },
    { name: 'Introduction to Relational Databases (RDBMS)', when: 'Nov 2025' },
    { name: 'Databases and SQL for Data Science with Python', when: 'Sep 2025' },
    { name: 'Hands-on Introduction to Linux Commands and Shell Scripting', when: 'Jan 2026' },
    { name: 'Relational Database Administration (DBA)', when: 'Jan 2026' },
    { name: 'ETL and Data Pipelines with Shell, Airflow and Kafka', when: 'Mar 2026' },
    { name: 'Data Warehouse Fundamentals', when: 'Mar 2026' },
    { name: 'BI Dashboards with IBM Cognos Analytics and Google Looker', when: 'Jul 2026' },
    { name: 'Introduction to NoSQL Databases', when: 'Sep 2026' },
    { name: 'Introduction to Big Data with Spark and Hadoop', when: null },
    { name: 'Machine Learning with Apache Spark', when: null },
    { name: 'Data Engineering Capstone Project', when: null },
    { name: 'Generative AI: Elevate your Data Engineering Career', when: null },
    { name: 'Data Engineering Career Guide and Interview Preparation', when: null },
  ] as { name: string; when: string | null }[],
};

export const skills = [
  { group: 'Languages', items: ['Python', 'TypeScript', 'JavaScript', 'C', 'C++', 'Java', 'SQL'] },
  { group: 'Web and APIs', items: ['FastAPI', 'Node.js', 'Express', 'React', 'Vite', 'Tailwind CSS', 'Three.js', 'Astro', 'REST API design'] },
  { group: 'Databases', items: ['PostgreSQL', 'MongoDB', 'MySQL', 'SQLite', 'Mongoose', 'Raw SQL', 'Stored procedures', 'Query optimization'] },
  { group: 'Data engineering', items: ['ETL pipeline design', 'Incremental loading', 'Schema normalization', 'Data warehousing', 'Fault-tolerant pipelines', 'Feature engineering'] },
  { group: 'Machine learning', items: ['XGBoost', 'scikit-learn', 'Pandas', 'NumPy', 'SentenceTransformers', 'SHAP', 'Model tuning and evaluation'] },
  { group: 'Cloud and delivery', items: ['Azure Blob Storage', 'Vercel', 'MongoDB Atlas', 'Neon', 'GitHub Actions', 'Playwright', 'Vitest'] },
  { group: 'Tools', items: ['Git and GitHub', 'Linux shell', 'Valgrind', 'GDB', 'Make', 'NetworkX', 'VS Code'] },
  { group: 'CS core', items: ['Data structures and algorithms', 'OOP', 'OS architecture', 'Memory management', 'Database normalization'] },
];

export const leadership = [
  {
    title: 'President, IEEE-CS GITAM Vizag',
    period: 'Sept 2026 – present',
    note: 'President of the IEEE Computer Society chapter at GITAM Visakhapatnam.', // TODO: add 1-2 concrete things the chapter has done under your presidency.
  },
  {
    title: 'Open Source Lead, GitHub Community GITAM',
    period: 'Aug 2026 – present',
    note: 'Leads the open-source domain: workshops and sessions on Git, GitHub and first contributions, including a Hacktoberfest 2026 session, and mentoring students through their first pull requests.',
  },
  {
    title: 'Aircraft Domain Lead, AeroGitam Club',
    period: 'Feb 2025 – Nov 2025',
    note: 'Domain member from Aug 2024.',
  },
];

export const hackathons = [
  { name: 'Smart India Hackathon 2026', result: 'Internal-round qualifier', what: 'Led development of the fake account and threat detection engine (SIH-1775, ITBP / Ministry of Home Affairs).' },
  { name: 'Smart India Hackathon 2025', result: 'Internal-round qualifier', what: 'Led development of TripSync, an AI-powered travel platform, delivering a working prototype from zero within 24 hours.' },
  { name: 'University Hackathon', result: 'Completed', what: 'Deployed the full KAPS MedTech backend within 24 hours: PostgreSQL schema, API endpoints and authentication.' },
];

export const alsoBuilt = [
  { name: 'ml', what: 'Entity resolution for the ML Challenge 2026: country-scoped blocking plus an XGBoost matcher.', repo: 'https://github.com/pushpam2404/ml', live: null },
  { name: 'sih_053', what: 'Smart India Hackathon (DRDO): foveated 2.5D LiDAR elevation map with obstacle detection, in C++ and Python.', repo: 'https://github.com/pushpam2404/sih_053', live: null },
  { name: 'sluice', what: 'Small Python data pipeline runner, set up as an open-source practice repo with issues.', repo: 'https://github.com/pushpam2404/sluice', live: null },
  { name: 'terminal-arcade', what: 'Terminal games in pure Python for first-time contributors.', repo: 'https://github.com/pushpam2404/terminal-arcade', live: null },
  // TODO: add repo links for TollFlow and the star-schema warehouse, if they are public.
  { name: 'TollFlow', what: 'Airflow-based ETL pipeline for highway toll data.', repo: null, live: null },
  { name: 'Star-schema warehouse', what: 'A star-schema warehousing setup in PostgreSQL.', repo: null, live: null },
];

export type Status = 'verified' | 'measured' | 'reported';
export const statusInfo: Record<Status, { label: string; meaning: string }> = {
  verified: { label: 'Verified', meaning: 'Anyone can check it in a public repo or live site.' },
  measured: { label: 'Measured', meaning: 'My own benchmark, with the method and caveats written down.' },
  reported: { label: 'Reported', meaning: 'My account of private or institutional work. No public evidence yet.' },
};

// figure + unit feed the large number beside the list in the Proof section. Both come from the claim text itself.
export const proof: { claim: string; evidence: string; status: Status; href: string | null; figure: string; unit: string }[] = [
  { claim: 'Trained on 101,302 labeled accounts (64,919 Twitter/X and 36,383 Meta).', evidence: 'Row counts of the two processed tables, documented in the repo README.', status: 'verified', href: 'https://github.com/pushpam2404/fake_acc#models-and-data', figure: '101,302', unit: 'labeled accounts, X and Meta combined' },
  { claim: '90.04% accuracy on X and 96.87% on Meta for the two classifiers.', evidence: 'Recorded in models/results.md. Re-evaluating the saved models on the same 20% stratified split gave 89.82% and 96.72%, which the README states plainly.', status: 'measured', href: 'https://github.com/pushpam2404/fake_acc#results', figure: '90.04%', unit: 'accuracy on X, with 96.87% on Meta' },
  { claim: 'X accuracy rose from about 67% to about 90% after removing a noisy tweet-level dataset.', evidence: 'My account from the project. The repo records the final numbers but not the before-and-after run.', status: 'reported', href: null, figure: '67→90%', unit: 'X accuracy before and after dropping a noisy dataset, approximate' },
  { claim: 'KAPS MedTech is live and its API is covered by an integration suite run in CI.', evidence: '23 integration test cases against a real PostgreSQL, run by GitHub Actions on every push, plus a live deployment.', status: 'verified', href: 'https://github.com/pushpam2404/KAPS-Medtech/tree/main/test/integration', figure: '23', unit: 'integration test cases run in CI' },
  { claim: 'Four simultaneous bookings of one slot cannot double-book it.', evidence: 'A unique partial index plus a test that fires four requests at once, described in docs/ARCHITECTURE.md.', status: 'verified', href: 'https://github.com/pushpam2404/KAPS-Medtech/blob/main/docs/ARCHITECTURE.md', figure: '4', unit: 'simultaneous bookings of one slot, none double-booked' },
  { claim: 'Built LegalLens chat history: a 316-line FastAPI module, 9 endpoints, 14+ bugs documented, a 27-entry bug tracker.', evidence: 'Employer code is private. An internship completion certificate and a write-up are on my LinkedIn.', status: 'reported', href: site.linkedin, figure: '9', unit: 'endpoints in a 316-line FastAPI module' },
  { claim: 'Internal-round qualifier at Smart India Hackathon 2026 and 2025.', evidence: 'The 2026 internal-round certificate is on my LinkedIn. The 2025 result has no public record yet.', status: 'reported', href: site.linkedin, figure: '2', unit: 'Smart India Hackathon internal-round qualifiers' },
  { claim: 'GITAM University, B.Tech CSE, CGPA 9.17.', evidence: 'University records, not public.', status: 'reported', href: null, figure: '9.17', unit: 'CGPA at GITAM University' },
  { claim: 'All 16 courses of the IBM Data Engineering Professional Certificate.', evidence: 'Nine are listed with credential IDs on my LinkedIn. I hold the other seven certificates and have not uploaded them yet.', status: 'reported', href: site.linkedin, figure: '16', unit: 'IBM Data Engineering course certificates' },
  { claim: 'Three public practice repositories for first-time contributors, tagged for Hacktoberfest: open-source-launchpad, terminal-arcade and sluice.', evidence: 'All three are public and carry the hacktoberfest topic on GitHub.', status: 'verified', href: 'https://github.com/pushpam2404/open-source-launchpad', figure: '3', unit: 'Hacktoberfest practice repositories' },
  { claim: 'Astra groups artists into clusters with a mean adjusted Rand index of 0.683 and purity of 0.855 across eight synthetic listeners.', evidence: 'The repository ships the test: histories built from Last.fm public charts, scored against the chart each artist came from. It needs the network and a Last.fm key, so it does not run in CI.', status: 'measured', href: 'https://github.com/pushpam2404/astra-3d-music-universe/tree/main/tests/tastes', figure: '0.683', unit: 'adjusted Rand index of Astra\'s clustering' },
];
