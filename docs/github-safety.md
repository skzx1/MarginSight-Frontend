# GitHub publication check — 15 October 2026

Target: `https://github.com/skzx1/NTT-DATA` (existing public repository).

The local heuristic scan found no credential candidates in the first-party
source files selected for Git. A broader scan also inspected 542 filesystem
files and 792 ZIP/Office archive entries, including ignored local files and
older releases; it found no candidates under the implemented patterns.
The two email-like strings in publishable source are dependency support/license
notices, not merchant contact details. The receipt image committed under
`fixtures/mock-v1/` was visually checked and is explicitly synthetic.

## Files kept on this computer

`.gitignore` excludes credentials, non-example `.env` files, local merchant data,
dependencies, build outputs, caches, release archives, original attachments,
generated documents, and `docs/evidence/` screenshots/raw evidence. These files
are preserved locally. Evidence links in the operating documents refer to local
files and are intentionally unavailable in a fresh GitHub checkout.

Deployment account IDs, resource names, public API/web URLs and Cognito SPA
client IDs remain in configuration/documentation. These identify resources;
they are not passwords, AWS secret access keys or a Cognito client secret.
The Cognito application uses a public client and PKCE.

## Limits and repeat checks

Run `python scripts/audit-secrets.py` for a redacted local report at
`.local/secret-audit-report.json`. It records paths/types/line numbers, never
matching values. It is a heuristic check, not a guarantee that every possible
secret is absent. Dependencies, Git object history and `.next/` caches are
excluded. Generic assignment checks skip generated/large bundles; specific
credential patterns still inspect those files. Images require visual review,
PDF contents are not extracted, and archives have decompression limits.
The excluded original PDFs/screenshots were not approved for publication.

The existing remote history consisted of its initial README commit before this
import. There was no earlier local Git history to audit. Subsequent commits or
outside contributions require a new check.

Before future commits, inspect `git diff --cached --stat` and confirm that no
private file was force-added with `git add -f`. `.gitignore` does not remove
already tracked files or erase published history. If a live secret is ever
committed, revoke/rotate it first and then handle the affected history.

Do not upload old ZIPs manually: `.gitignore` does not apply to browser uploads
or releases. `scripts/package-release.py` creates operator delivery archives
that can include local evidence; those are separate from the GitHub source set.
