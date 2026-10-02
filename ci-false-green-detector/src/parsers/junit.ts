import { readFileSync, statSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";
import type { ParsedReport, TestCaseResult } from "../types.js";

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Parses a JUnit XML report (the de-facto format emitted by most test
 * runners: Jest, Pytest, Playwright, Mocha with the junit reporter, etc.)
 */
export function parseJUnitReport(filePath: string): ParsedReport {
  const xml = readFileSync(filePath, "utf-8");
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(xml);

  const suites = toArray(doc.testsuites?.testsuite ?? doc.testsuite);
  const cases: TestCaseResult[] = [];

  for (const suite of suites) {
    for (const tc of toArray(suite.testcase)) {
      const name = tc["@_name"] ?? "unknown";
      const durationSeconds = Number(tc["@_time"] ?? 0);
      let status: TestCaseResult["status"] = "passed";
      if (tc.failure !== undefined || tc.error !== undefined) status = "failed";
      else if (tc.skipped !== undefined) status = "skipped";
      cases.push({ name, durationSeconds, status });
    }
  }

  const stat = statSync(filePath);
  return { cases, reportGeneratedAt: stat.mtime };
}
