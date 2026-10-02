# flaky-test-confidence-gate

A Playwright Test reporter that only fails the build on a **second**
consecutive failure of the same test, filtering out one-off flakiness
without masking a real regression.

## Why

Regression tests running in shared environments (flaky network, external
services, timing) produce false reds. If the pipeline blocks a deploy on
any isolated failure, the team learns to ignore the alert — and a real
failure slips through buried in the noise.

## Rules

- 1st failure of a test: logged as a warning, does not block, triggers a
  retry.
- 2nd consecutive failure of the same test: blocks and reports as a real
  failure.
- A test that passes on retry: history resets, counted as flaky (a
  separate metric), not as a failure.
- Exposed metrics: flakiness rate per test, time to confirmation, false
  reds avoided.

## Usage

```ts
// playwright.config.ts
export default defineConfig({
  reporter: [["flaky-test-confidence-gate/dist/reporter.js", { historyFile: ".flaky-gate-history.json" }]],
});
```

```bash
npm install && npm run build
```

## Status

Generalization of a real gate (a production regression pipeline only
turning red after failure was confirmed across two runs, meaningfully
reducing false reds). Reimplemented from scratch as a standalone
Playwright reporter, no original pipeline config or metrics script
included.
