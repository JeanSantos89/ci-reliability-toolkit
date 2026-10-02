# slack-ci-alert-bridge

Posts a CI failure or recovery message to Slack through an incoming
webhook — a few lines of `fetch`, not a platform integration.

## Why

Not every CI server has an admin-installable Slack plugin, and
asking for one is sometimes a longer road than just POSTing JSON to a
webhook URL from a `run_if: failed` step already available to any
pipeline author.

## Usage

```bash
npm install && npm run build
node dist/index.js \
  --webhook-url https://hooks.slack.com/services/XXX \
  --pipeline my-pipeline --job integration-tests \
  --build-url https://ci.example.com/build/123 --status failed
```

## Status

Generalization of a real workaround (Slack alerting on CI failure without
admin access to install a native plugin). Reimplemented from scratch, no
original webhook URLs or pipeline names included.
