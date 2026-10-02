# stale-ci-source-detector

Checks whether the repository backing a CI pipeline has been archived.
If it has, the pipeline is quietly testing a frozen snapshot forever —
every green run is proving nothing about the code anyone is actually
shipping.

## Why

A pipeline's source config (which repo/branch triggers it) is usually set
once and rarely revisited. When the real work moves to a different
repository and the old one gets archived, nothing breaks loudly: the
pipeline keeps running against the last commit the archived repo ever
had, and keeps reporting green.

## Usage

```bash
npm install && npm run build
node dist/index.js --repo-url https://github.com/some-org/some-repo --token $GITHUB_TOKEN
```

Run it as an early step in the pipeline it protects; a non-zero exit
fails the build before wasting time on frozen code.

## Status

Generalization of a real diagnosis (a CI pipeline's material pointed at
an archived mirror of the actual repo). Reimplemented from scratch
against the public GitHub API, no original pipeline config or host
included.
