# conditional-ci-pipeline-template

A reusable pattern for gating CI jobs behind a label instead of hardcoding
branch names or always running the full suite. One composite action
(`label-gate`) checks whether the current pull request carries a given
label and exposes a boolean output that downstream jobs read in their
`if:` condition.

## Why

Expensive or environment-dependent test suites (end-to-end, slow
integration, suites that need a live external dependency) shouldn't run
on every single push. Tagging a PR with a label and gating the job on it
keeps CI fast by default while still letting anyone opt in explicitly.

## Usage

See `.github/workflows/example-conditional.yml` for a full example: a
`fast-tests` job that always runs, and a `slow-tests` job that only runs
when the PR carries the `run-slow-tests` label.

## Status

Generalization of a tagging convention used internally to control which
CI jobs run depending on environment reachability and deploy timing.
Reimplemented here as a generic GitHub Action, no original pipeline
config included.
