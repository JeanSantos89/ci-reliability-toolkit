import { readFileSync, statSync } from "node:fs";
import type { ParsedReport, TestCaseResult } from "../types.js";

interface MochawesomeTest {
  title: string;
  duration?: number; // milliseconds
  state?: "passed" | "failed" | null;
  pending?: boolean;
}

interface MochawesomeSuite {
  tests?: MochawesomeTest[];
  suites?: MochawesomeSuite[];
}

interface MochawesomeReport {
  results: MochawesomeSuite[];
}

function collectCases(suite: MochawesomeSuite, acc: TestCaseResult[]): void {
  for (const test of suite.tests ?? []) {
    let status: TestCaseResult["status"] = "passed";
    if (test.pending) status = "skipped";
    else if (test.state === "failed") status = "failed";
    acc.push({
      name: test.title,
      durationSeconds: (test.duration ?? 0) / 1000,
      status,
    });
  }
  for (const nested of suite.suites ?? []) {
    collectCases(nested, acc);
  }
}

/** Parses a Mochawesome JSON report. */
export function parseMochawesomeReport(filePath: string): ParsedReport {
  const raw = readFileSync(filePath, "utf-8");
  const report: MochawesomeReport = JSON.parse(raw);

  const cases: TestCaseResult[] = [];
  for (const suite of report.results ?? []) {
    collectCases(suite, cases);
  }

  const stat = statSync(filePath);
  return { cases, reportGeneratedAt: stat.mtime };
}
