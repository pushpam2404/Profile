---
name: Dual-Platform Fake Account & Threat Detection Engine
codename: SIH-1775
year: 2026
context: Smart India Hackathon problem statement 1775, set by the Indo-Tibetan Border Police under the Ministry of Home Affairs.
org: itbp
repo_url: https://github.com/pushpam2404/fake_acc
live_url: null
status: prototype
summary: Two platform-specific XGBoost classifiers over 101,302 labelled accounts, joined to a local sentence-embedding threat analyser, a coordinated-behaviour graph and a forensic PDF export. The accuracy figures are held-out evaluation numbers, not field results.
stack:
  - Python
  - XGBoost
  - SHAP
  - PyTorch
  - SentenceTransformers
  - FastAPI
  - React
  - TypeScript
  - Vite
  - Playwright
  - NetworkX
  - fpdf2
skills:
  - python
  - xgboost
  - scikit-learn
  - feature-engineering
  - model-tuning-and-eval
  - shap-explainability
  - sentencetransformers
  - fastapi
  - react
  - typescript
  - playwright
  - networkx
order: 2
---

## The problem

Fake accounts, impersonators and coordinated botnets look different on different
platforms, and a single model trained across all of them learns the average of two
distributions and is good at neither. A law-enforcement analyst also cannot act on
a probability alone: a score with no stated reason is not usable in a case file.

## The approach

The engine is split by platform rather than unified. A Twitter/X model uses 13
features and a Meta model uses 7, because the two platforms expose different
fields and the ratios that separate a real account from a synthetic one are not
the same on both.

The X feature set is followers, following, post count, verified flag, description
length, account age in days, follower-to-following ratio, reputation score,
username length, digits in username, digit ratio in username, presence of a URL,
and posts per day. The Meta set is followers, following, post count, presence of a
profile picture, bio length, follower-to-following ratio, and reputation score.

Tabular classification is only half of it. A local `all-MiniLM-L6-v2`
SentenceTransformer runs under PyTorch on CPU or Apple Silicon MPS and computes
pairwise cosine similarity across a profile's captions, which is how automated
syndication shows itself: a set of posts that are too similar to each other. The
same 384-dimensional embeddings are scored against threat anchors for information
warfare, state subversion, hate sloganeering and financial scams. None of this
calls an external model, so nothing leaves the machine and there is no token cost.

A separate lexical check catches impersonation that the numbers miss. It tokenises
the display name against the handle: a profile whose display name claims a public
identity while the handle shares no tokens with it is flagged as synthetic
impersonation, as are `official_`, `real_` and `support_` monikers on unverified
handles.

## Architecture

A FastAPI backend serves single-account inference, live URL scanning, batch CSV
upload and PDF export. Live scanning uses Playwright headless Chromium to read the
public profile DOM, avatar, bio and posts; no credentials are stored anywhere in
the system. A NetworkX layer computes degree centrality, graph density and clique
count over accounts that share signals, and the React dashboard renders that as a
force-directed graph. The export produces a case file containing the target
summary, the SHAP attribution for the decision, telemetry tables with human
baselines, the multimodal findings and SHA-256 integrity hashes, laid out for
Section 65B of the Indian Evidence Act.

The measured results, from the repository's benchmark table: the X model reaches
90.04 percent accuracy and 85.63 percent F1 on 64,919 accounts with 0.18 second
inference; the Meta model reaches 96.87 percent accuracy and 97.15 percent F1 on
36,383 accounts with 0.12 second inference.

The X number was not always 90. Accuracy sat at 67 percent and would not move.
The cause turned out to be a mislabelled 50,000-row subset of the training data.
Removing it, and splitting feature engineering into the two platform-specific
pipelines rather than one shared one, moved accuracy 23 points. That diagnosis is
the part of this project worth reading; the final number is a consequence of it.

## What it does not do

Both accuracy figures are held-out evaluation splits of labelled research
datasets, not measurements against live platform traffic. The training data comes
from public research corpora, so the labels are somebody else's judgement, not
ground truth from the platforms themselves, and a distribution shift between those
corpora and current accounts is neither measured nor corrected for.

The semantic layer carries no accuracy figure of any kind. It is zero-shot, it has
never been scored against a labelled threat corpus, and there is therefore no
precision or recall number for it to report. The 80 percent caption-uniformity
threshold that marks a profile as syndicated is a chosen cut-off, not a tuned one.

Nothing here has been used in a live investigation, and the forensic export is
formatted for Section 65B rather than reviewed against it.
