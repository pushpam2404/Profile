---
name: High-Performance Autocomplete Engine
codename: null
year: 2026
context: A systems-programming project in C. A prefix-tree autocomplete backend with ranked suggestions and an on-disk index.
repo_url: null
live_url: null
status: shipped
summary: A trie-based autocomplete backend in C with O(k) lookup in the query length, a min-heap for top-N ranking in O(log N), and a binary serialisation format so the index does not have to be rebuilt on start. There is no public repository, so none of this is independently checkable.
stack:
  - C
  - Make
  - Valgrind
  - GDB
skills:
  - c
  - make
  - valgrind
  - gdb
  - data-structures-and-algorithms
  - memory-management
order: 5
---

## The problem

Autocomplete is a latency problem before it is a relevance problem. A suggestion
that arrives after the next keystroke is not a suggestion. The property worth
engineering for is that lookup cost depends on how much the user has typed and not
on how large the corpus is, because the corpus only grows.

## The approach

The index is a trie. Walking it costs one step per character, so a lookup is O(k)
in the query length k and is independent of the total number of terms stored. That
is the whole argument for the data structure, and it is why a hash table was not
the right answer here: a hash table answers "is this exact string present" in
constant time and cannot answer "what continues this prefix" at all.

Ranking sits on top. Once the prefix node is reached, the candidate terms below it
are fed through a min-heap priority queue that keeps the top N by frequency,
costing O(log N) per insertion rather than sorting the full candidate set. The
result is a ranked suggestion list produced without a sort pass.

Memory is managed by hand, as it has to be in C. Allocation follows deliberate
patterns intended to keep heap fragmentation down rather than allocating node by
node wherever a node happens to be needed.

## Architecture

Two pieces do the work and one piece makes them survive a restart. The trie holds
structure, the heap holds ranking, and a binary serialisation protocol writes the
whole trie to disk and reads it back, so a cold start loads an index instead of
rebuilding one from the raw source data. Without that, every process start pays
the full construction cost; with it, start is a read.

The build is a plain Makefile. Debugging is GDB. Memory correctness is Valgrind,
and the engine runs clean across the project's test cases with no leaks reported.

## What it does not do

There is no public repository for this project. Everything on this page is the
author's description of his own code, and a reader cannot open it and check.
That is the reason the complexity figures here are recorded as measured properties
of the implementation with the method stated, and not as performance results.

O(k) and O(log N) are complexity bounds, not timings. No wall-clock benchmark was
recorded, no dataset size was fixed, and no comparison against a baseline
implementation exists, so there is no throughput or latency number to quote. The
claim that a cold start is sub-second rests on the serialisation design rather
than on a recorded measurement.

The Valgrind result is clean on the project's own test cases. There is no fuzzing
run, no published corpus, and no adversarial input set behind it.
