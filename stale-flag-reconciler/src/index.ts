#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import fg from "fast-glob";

interface StaleFlagMatch {
  file: string;
  line: number;
  flagId: string;
}

const FLAG_PATTERN = /@pending:([A-Za-z0-9_-]+)/g;

/**
 * A "skip this until X ships" tag is only useful while X is actually
 * pending. Left unchecked, it rots: the dependency ships, nobody
 * remembers to remove the tag, and code or tests stay disabled forever
 * for a condition that's no longer true.
 */
function findFlags(code: string, filePath: string): StaleFlagMatch[] {
  const matches: StaleFlagMatch[] = [];
  code.split("\n").forEach((line, idx) => {
    for (const match of line.matchAll(FLAG_PATTERN)) {
      matches.push({ file: filePath, line: idx + 1, flagId: match[1] });
    }
  });
  return matches;
}

function printHelp(): void {
  console.log(`stale-flag --glob "<pattern>" --resolved-ids <resolved.json>

resolved.json: a JSON array of IDs that are now resolved/shipped, e.g. ["PROJ-123", "PROJ-456"]
Reports every @pending:<id> tag found in the glob whose id is in that list.`);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      glob: { type: "string" },
      "resolved-ids": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help || !values.glob || !values["resolved-ids"]) {
    printHelp();
    process.exit(values.help ? 0 : 1);
  }

  const resolvedIds = new Set<string>(JSON.parse(readFileSync(values["resolved-ids"]!, "utf-8")));
  const files = await fg(values.glob!);

  let staleCount = 0;
  for (const file of files) {
    const code = readFileSync(file, "utf-8");
    for (const match of findFlags(code, file)) {
      if (resolvedIds.has(match.flagId)) {
        console.log(`${match.file}:${match.line}  stale flag @pending:${match.flagId} — dependency is resolved, remove the tag`);
        staleCount++;
      }
    }
  }

  console.log(`\n${staleCount} stale flag(s) found.`);
  process.exit(staleCount > 0 ? 1 : 0);
}

main();
