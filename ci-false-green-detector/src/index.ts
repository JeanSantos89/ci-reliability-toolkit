#!/usr/bin/env node
import { parseArgs } from "node:util";
import { parseJUnitReport } from "./parsers/junit.js";
import { parseMochawesomeReport } from "./parsers/mochawesome.js";
import { detectFalseGreen } from "./detect.js";
import type { DetectorConfig, ParsedReport } from "./types.js";

function printHelp(): void {
  console.log(`ci-false-green-detector (cfgd)

Usage:
  cfgd --report <path> --format <junit|mochawesome> [options]

Options:
  --min-cases <n>           Minimum number of test cases expected
  --min-avg-duration <sec>  Minimum average duration per case, in seconds
  --job-started-at <iso>    ISO timestamp of when the CI job started
  --require-artifact <path> Path that must exist (repeatable)
  -h, --help                Show this help
`);
}

function main(): void {
  const { values } = parseArgs({
    options: {
      report: { type: "string" },
      format: { type: "string" },
      "min-cases": { type: "string" },
      "min-avg-duration": { type: "string" },
      "job-started-at": { type: "string" },
      "require-artifact": { type: "string", multiple: true },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help || !values.report || !values.format) {
    printHelp();
    process.exit(values.help ? 0 : 1);
  }

  const report: ParsedReport =
    values.format === "junit"
      ? parseJUnitReport(values.report!)
      : parseMochawesomeReport(values.report!);

  const config: DetectorConfig = {
    minExpectedCases: values["min-cases"] ? Number(values["min-cases"]) : undefined,
    minAvgDurationSeconds: values["min-avg-duration"] ? Number(values["min-avg-duration"]) : undefined,
    jobStartedAt: values["job-started-at"] ? new Date(values["job-started-at"]) : undefined,
    requiredArtifacts: values["require-artifact"] ?? [],
  };

  const result = detectFalseGreen(report, config);

  console.log(`Cases found: ${result.caseCount}`);
  console.log(`Average duration: ${result.avgDurationSeconds.toFixed(3)}s`);

  if (result.ok) {
    console.log("OK: no false-green signals detected.");
    process.exit(0);
  }

  console.log("FAILED: false-green signals detected:");
  for (const signal of result.signals) {
    console.log(`  [${signal.code}] ${signal.message}`);
  }
  process.exit(1);
}

main();
