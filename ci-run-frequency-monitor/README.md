# ci-run-frequency-monitor

Flags a pipeline as crash-looping or stalled by counting how many times
it actually ran per hour — a check that catches problems a green status
badge hides completely.

## Why

"Success" on every run doesn't mean the pipeline is healthy. A webhook
misfire can make it fire far more often than scheduled (quietly burning
CI minutes and masking the real signal in noise), or it can stop firing
altogether while the last recorded status stays green forever.

## Usage

```bash
npm install && npm run build
node dist/index.js --runs example/runs.json --min-per-hour 1 --max-per-hour 4
```

## Status

Generalization of a real heuristic (counting pipeline runs per hour: ~2
meant healthy, ~6 meant crash-looping) used to catch a CI pipeline whose
"success" status was misleading. Reimplemented from scratch, no original
run data included.
