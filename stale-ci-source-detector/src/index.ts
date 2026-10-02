#!/usr/bin/env node
import { parseArgs } from "node:util";

interface RepoRef {
  owner: string;
  repo: string;
}

function parseGitHubUrl(url: string): RepoRef | null {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)(\.git)?$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/**
 * A CI pipeline whose "material" (source trigger) points at a repository
 * that has since been archived keeps testing a frozen snapshot forever,
 * silently drifting from the real, actively developed codebase. This
 * checks the GitHub archived flag for a given remote URL.
 */
async function isArchived(ref: RepoRef, token?: string): Promise<boolean> {
  const response = await fetch(`https://api.github.com/repos/${ref.owner}/${ref.repo}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${ref.owner}/${ref.repo}`);
  }
  const data = (await response.json()) as { archived: boolean };
  return data.archived;
}

function printHelp(): void {
  console.log(`stale-ci-source --repo-url <github-url> [--token <github-token>]

Exits 1 and prints a warning if the repository backing a CI pipeline has
been archived. Intended to run as an early CI step, failing fast instead
of letting the pipeline test frozen code indefinitely.`);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "repo-url": { type: "string" },
      token: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help || !values["repo-url"]) {
    printHelp();
    process.exit(values.help ? 0 : 1);
  }

  const ref = parseGitHubUrl(values["repo-url"]!);
  if (!ref) {
    console.error(`Could not parse a GitHub owner/repo from: ${values["repo-url"]}`);
    process.exit(2);
  }

  const archived = await isArchived(ref!, values.token);
  if (archived) {
    console.error(`STALE SOURCE: ${ref!.owner}/${ref!.repo} is archived. This pipeline is testing frozen code.`);
    process.exit(1);
  }

  console.log(`OK: ${ref!.owner}/${ref!.repo} is active.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
