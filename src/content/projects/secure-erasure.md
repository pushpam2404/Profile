---
name: Integrated Secure Data Erasure & Advanced File Recovery
codename: SIH 26149
year: 2026
context: Smart India Hackathon problem statement 26149, set by the National Technical Research Organisation.
org: ntro
repo_url: https://github.com/pushpam2404/SIH_149
live_url: null
status: prototype
summary: One desktop application that both destroys data and recovers it, with every action written to a hash-chained, tamper-evident audit log and exported as a signed certificate. A hackathon prototype, not a certified product, and its README says so first.
stack:
  - Python
  - pytsk3
  - PhotoRec
  - bulk_extractor
  - Magika
  - Ed25519
  - SHA-256 hash chain
skills:
  - python
  - os-architecture
order: 1
---

## The problem

An investigator who needs to destroy data uses one tool, and an investigator who
needs to recover it uses another. Neither tool knows about the other, and nothing
connects the two records. When the question later becomes *what was on this drive,
and what happened to it*, there is no single account that can be checked.

This project puts both workflows behind one append-only audit log so that every
erase and every recovery scan can be verified after the fact, and so the record
can be exported as a certificate structured after the electronic-evidence
certificate in Section 63 of India's Bharatiya Sakshya Adhiniyam, 2023.

## The approach

Four modules share one log.

The **drive eraser** writes over disk images and removable drives using a single
pass, NIST 800-88 Clear, or DoD 5220.22-M, and reads a sample of blocks back after
each pass to confirm the write landed. Simulation mode is the default, and the
system drive can never be selected.

The **file eraser** overwrites a file, renames it to a random name, clears extended
attributes, and unlinks it, with per-filesystem warnings where that sequence is
known to be insufficient: copy-on-write filesystems such as APFS, ReFS and Btrfs,
the NTFS master file table and shadow copies, the ext4 journal, and FAT name
handling.

The **carving and recovery** module runs three engines with different failure
modes. pytsk3 reads the filesystem metadata, PhotoRec carves by signature when the
metadata is gone, and bulk_extractor pulls personally identifying artefacts out of
raw bytes. Recovered files are typed by a signature table, by libmagic and by
Magika, hashed with SHA-256 and a fuzzy hash, and given a 0 to 100 confidence score
built from how far the engines agree.

The **audit and reporting** module is the part that makes the rest meaningful: a
SHA-256 hash chain with a per-entry HMAC tag, append-only database triggers, a
chain verification action in the interface, and PDF and JSON export.

## Architecture

The application runs on Windows 10 and 11, Linux and macOS, and draws its own
theme, fonts, icons and file picker, so the only visible difference between the
three is the window title bar. Erasure and recovery are separate engines that both
write to the same log rather than to their own; the log is the integration point,
not a shared library of primitives.

Benchmarks were taken on an Apple M4 with disk images on the internal SSD, median
of three runs, on 2026-09-17. NIST 800-88 Clear on a 512 MB image, including
verification, takes 1.2 seconds. DoD 5220.22-M on the same image takes 6.1
seconds. Erasing 100 files of 64 KB takes 0.05 seconds, down from 23.4 seconds
before per-volume caching. A pytsk3 recovery scan of a 128 MB FAT image takes 0.02
seconds and returns the deleted file 3 times out of 3; PhotoRec takes 0.28 seconds
on the same image and returns it 0 times out of 3, because a plain text file has no
signature to carve.

Those numbers measure software overhead on a fast internal SSD. A physical USB
drive is limited by its own write speed, and none of these figures were taken on
one.

## What it does not do

The repository keeps a table of what is tested, what works with caveats, and what
was never done, and the honest version of this page is a restatement of it.

NIST 800-88 Purge and firmware Secure Erase are not implemented. The NVMe and ATA
sanitize commands are generated as reference strings and never executed. There is
no recorded erase test against a physical drive on any operating system, which is
why the platform matrix marks that row untested on all three. bulk_extractor is
wired in but is not installed on the development machine or in CI, so that path has
never run. Partition-table recovery is absent because TestDisk is not wired in.
RFC 3161 trusted timestamping is not part of the application flow. There is no
Windows code signing and no installer.

Two further gaps matter more than they sound. There is no recovery-rate
measurement against a real forensic corpus, only small purpose-built FAT images, so
the tool has no claim to make about how much it recovers in the field. And
bifragment gap carving exists in `reassembly.py` but is called with
`attempt_gap_carving=False`: built, not enabled.

The caveats on the things that do work are equally load-bearing. Erase
verification reads a sample, not the whole drive, and the sample shrinks as the
drive grows: 100 percent at 64 MB, 6 percent at 1 GB, 0.2 percent at 1 TB.
Overwriting does not guarantee physical erasure on SSDs, flash, or copy-on-write
filesystems. The audit HMAC key and the certificate signing key load from the
operating system keystore, with a private file as fallback; that is not a PKI, and
anyone who can read the key can still forge a chain. The log is tamper-evident,
not tamper-proof: it detects edits, it cannot prevent them. The certificate is
Ed25519-signed but has not been legally reviewed, and no certificate authority
binds the key to an identity. The confidence scores are uncalibrated heuristics.
Fuzzy hashing is skipped above 4 MiB because the pure-Python implementation is too
slow.
