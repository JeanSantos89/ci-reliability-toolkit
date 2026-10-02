# ci-false-green-detector

Detects a CI pipeline reporting success from a fabricated or empty test
report — the report says "0 failures" because nothing ran to fail, not
because the suite passed.

## Why

Pipelines that run a test suite and read the result from a generated
report file (JUnit XML, Mochawesome, Allure, etc.) can report success
even when the test step failed silently before the report was ever
written — a missing write permission, a nonexistent directory, or a
runner error swallowed before the assertions ran. This is more dangerous
than a red build: the team trusts the green badge and the bug ships to
production.

## Usage

```bash
npm install && npm run build
node dist/index.js --report report.json --format mochawesome \
  --min-cases 50 --min-avg-duration 0.5 \
  --job-started-at 2026-01-01T10:00:00Z \
  --require-artifact screenshots/last-run.png
```

It fails the build (non-zero exit code) if any of these signals fire,
even when the underlying report itself says "passed":

- Case count far below what's expected (`--min-cases`).
- Suspiciously fast average duration per case (`--min-avg-duration`) — a
  suite that "ran" in milliseconds almost certainly didn't.
- A stale report file, older than when the job started (`--job-started-at`)
  — a leftover from a previous run, not a fresh one.
- A required artifact (screenshot, log) missing (`--require-artifact`).

## Status

Generalization of a real detector (a CI report tool with no write
permission silently produced an empty, instantly "passing" report).
Reimplemented from scratch here, no original code, host, or pipeline
config included.
