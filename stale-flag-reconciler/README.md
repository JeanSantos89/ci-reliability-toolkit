# stale-flag-reconciler

Finds `@pending:<id>` tags left in code or tests whose referenced
dependency has since been resolved, so the tag (and whatever it's
suppressing — a disabled test, a skipped check) can finally be removed.

## Why

"Skip this until X is done" tags are necessary, but nobody's job is to
go back and remove them once X actually ships. They rot silently,
quietly keeping coverage disabled for a condition that stopped being true
weeks ago — in one real case, a batch of tests sat tagged as blocked long
after their blocker had shipped.

## Usage

```bash
npm install && npm run build
node dist/index.js --glob "tests/**/*.ts" --resolved-ids example/resolved.json
```

## Status

Generalization of a real cleanup pattern (reconciling an "awaiting
deploy" tag against what had actually shipped, recovering tests that had
been silently stuck). Reimplemented from scratch as a generic tag
scanner, no original tag names or ticket IDs included.
