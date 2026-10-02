#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { analyzeRunFrequency, type RunRecord } from "./analyze.js";

function printHelp(): void {
  console.log(`ci-run-freq --runs <runs.json> --min-per-hour <n> --max-per-hour <n>

runs.json: a JSON array of ISO timestamps, e.g. ["2026-01-01T10:03:00Z", ...]`);
}

function main(): void {
  const { values } = parseArgs({
    options: {
      runs: { type: "string" },
      "min-per-hour": { type: "string" },
      "max-per-hour": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help || !values.runs || !values["min-per-hour"] || !values["max-per-hour"]) {
    printHelp();
    process.exit(values.help ? 0 : 1);
  }

  const timestamps: string[] = JSON.parse(readFileSync(values.runs!, "utf-8"));
  const runs: RunRecord[] = timestamps.map((t) => ({ startedAt: new Date(t) }));

  const result = analyzeRunFrequency(runs, {
    min: Number(values["min-per-hour"]),
    max: Number(values["max-per-hour"]),
  });

  console.log(result.message);
  console.log(JSON.stringify(result.runsPerHourByBucket, null, 2));
  process.exit(result.verdict === "ok" ? 0 : 1);
}

main();
