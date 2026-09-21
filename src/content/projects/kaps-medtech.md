---
name: KAPS MedTech
codename: null
year: 2026
context: Built for the Gitathon university hackathon at GITAM, then carried on afterwards. A clinic dashboard connecting students and staff with university doctors.
org: gitam
repo_url: https://github.com/pushpam2404/KAPS-Medtech
live_url: https://kaps-medtech.vercel.app
status: shipped
summary: A university clinic management system on serverless PostgreSQL with a third-normal-form schema, raw SQL rather than an ORM, and an inventory module that quarantines expired medication automatically.
stack:
  - PostgreSQL
  - Neon Serverless
  - Node.js
  - Express
  - Raw SQL
  - JWT
  - BCrypt
skills:
  - postgresql
  - raw-sql
  - sql
  - database-normalization
  - schema-normalization
  - nodejs
  - expressjs
  - javascript
order: 4
---

## The problem

A university clinic has three kinds of user with genuinely different needs, and a
system that models them as one user type with a role flag ends up leaking data
between them. A student needs to book against the right department, a doctor needs
a queue and the patient's prior history, and both need the guarantee that neither
can read the other's records by changing an identifier in a URL.

The second problem is the medicine cabinet. Prescriptions have a duration, and a
prescription that has run out is not a prescription any more. Left to a manual
audit, expired entries accumulate and the list stops being trustworthy.

## The approach

The schema came first and was normalised to third normal form: users, doctors
joined one-to-one to a user, a symptom dictionary mapped to departments,
appointments, medical records linked to appointments, and prescriptions linked to
medical records. Transitive dependencies were eliminated rather than worked around
in application code, and referential integrity is enforced by the database, not by
the request handler.

Queries are written as raw SQL against a connection pool. That was a deliberate
choice over an ORM: the relationships here are the interesting part of the system,
and an ORM would have hidden exactly the joins that needed to be thought about.

The inventory module reads the prescribed duration and auto-expires medications
past it, so the active list is computed rather than maintained. Booking runs
through the symptom dictionary, which suggests a department in real time and warns
a patient who describes knee pain and then selects ENT.

## Architecture

A browser client talks REST to an Express server. Every request passes an
authentication layer holding JWT scope checks and an IP rate limiter before it
reaches the connection pool, which talks to a Neon serverless PostgreSQL instance
over SSL. Sessions are stateless: BCrypt hashes the password, a JWT carries the
session, and the server holds nothing between requests, which is what lets the
whole thing run on serverless infrastructure at all.

Access isolation is a per-endpoint guard rather than a global middleware
assumption: rescheduling an appointment or fetching a medical file is restricted
to the specific patient or doctor attached to that record. Server exceptions are
sanitised into generic responses, with the detailed trace logged rather than
returned.

The database is initialised and seeded by a single script, `init_db.js`, that
creates tables, foreign keys and indexes and populates the symptom and doctor
dictionaries, so a fresh environment is one command away.

## What it does not do

The automated suite is 29 functional checks covering input validation, rate
limiting, duplicate protection, queue completion and resource isolation. That is a
count of checks, not a coverage figure, and nothing measures what fraction of the
codebase they touch.

The system handles protected health information but has not been audited against
any healthcare data-protection standard. BCrypt hashing, JWT sessions and SSL
enforcement are the right primitives; they are not a compliance claim, and no such
claim is made here.

The live deployment is seeded with demo accounts whose credentials are published in
the repository README, which is appropriate for a demonstration and would be
disqualifying anywhere else. There is no load testing, no measurement of query
performance under concurrency, and no backup or migration strategy.
