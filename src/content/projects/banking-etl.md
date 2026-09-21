---
name: "Global Banking Data: ETL Pipeline"
codename: null
year: 2026
context: A personal data-engineering project. Scrapes market-capitalisation data for the world's largest banks and loads it into a local SQL warehouse.
repo_url: https://github.com/pushpam2404/global-finance-etl
live_url: null
status: shipped
summary: A fault-tolerant extract, transform and load pipeline in Python that ingests heterogeneous financial sources, normalises them into one SQL schema, and refuses to load anything that fails validation.
stack:
  - Python
  - Pandas
  - NumPy
  - BeautifulSoup4
  - Requests
  - SQLite
skills:
  - python
  - sql
  - etl-pipeline-design
  - fault-tolerant-pipeline-architecture
  - schema-normalization
  - incremental-delta-loading
  - pandas
  - numpy
  - sqlite
order: 3
---

## The problem

Market capitalisation figures for the world's largest banks live on public web
pages that change their HTML without warning, report in different currencies, and
disagree with each other about precision. A pipeline that assumes any of that is
stable will not merely fail; it will quietly load bad rows and the failure will
surface weeks later as an analytics result nobody can explain.

## The approach

The pipeline is built so that failure is loud and pre-load. Extraction targets the
page structure rather than a fixed offset, so a shifted column does not silently
read the wrong field. Transformation normalises currency, enforces type validation
at the boundary, and replaces loop-based calculation with vectorised NumPy
operations. Loading writes to a SQLite warehouse and to CSV for downstream use.

Every stage writes a timestamped log entry. The point of that log is not
observability for its own sake: it is the mechanism by which an ingestion failure
or a schema mismatch is intercepted before the load step runs, so a corrupt batch
never reaches the warehouse in the first place.

## Architecture

Extract, transform and load are three separate stages with the log as the seam
between them, rather than one script that does everything in a single pass. That
shape is what makes the stages independently testable and what lets a delta load
replace a full batch refresh: because the load stage knows what it wrote last
time, a run only reprocesses what changed rather than rebuilding the table.

## What it does not do

The public repository is the smaller, earlier form of this project: it scrapes one
source, normalises currency, and loads to SQLite and CSV. The broader description
carried on the author's resume, including multi-source ingestion, outlier
detection, incremental delta loading and a 30 percent reduction in data
redundancy, describes work that the published code does not demonstrate on its
own. That 30 percent figure is stated on the resume and is recorded on this site
as self-reported, because no before-and-after measurement was published alongside
it.

There is no orchestration layer. The pipeline runs when it is run. There is no
Airflow DAG, no scheduler, no retry policy beyond the extraction logic itself, and
no test suite in the repository. The warehouse is a local SQLite file, so nothing
here has been exercised at a size where SQLite would stop being the right answer.
