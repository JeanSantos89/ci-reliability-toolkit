import { existsSync } from "node:fs";
import type { DetectionResult, DetectorConfig, ParsedReport, Signal } from "./types.js";

/**
 * Runs every configured heuristic against a parsed report and returns
 * whether the run should be trusted. A "green" report with signals is
 * still reported as not-ok: the point is to catch success that was never
 * earned.
 */
export function detectFalseGreen(report: ParsedReport, config: DetectorConfig): DetectionResult {
  const signals: Signal[] = [];
  const caseCount = report.cases.length;
  const totalDuration = report.cases.reduce((sum, c) => sum + c.durationSeconds, 0);
  const avgDurationSeconds = caseCount > 0 ? totalDuration / caseCount : 0;

  if (caseCount === 0) {
    signals.push({ code: "EMPTY_REPORT", message: "Report contains zero test cases." });
  }

  if (config.minExpectedCases !== undefined && caseCount < config.minExpectedCases) {
    signals.push({
      code: "CASE_COUNT_TOO_LOW",
      message: `Expected at least ${config.minExpectedCases} cases, found ${caseCount}.`,
    });
  }

  if (
    config.minAvgDurationSeconds !== undefined &&
    caseCount > 0 &&
    avgDurationSeconds < config.minAvgDurationSeconds
  ) {
    signals.push({
      code: "SUSPICIOUSLY_FAST",
      message: `Average duration per case (${avgDurationSeconds.toFixed(3)}s) is below the expected minimum (${config.minAvgDurationSeconds}s) — the suite likely did not really execute.`,
    });
  }

  if (config.jobStartedAt && report.reportGeneratedAt && report.reportGeneratedAt < config.jobStartedAt) {
    signals.push({
      code: "STALE_REPORT",
      message: `Report file was last modified at ${report.reportGeneratedAt.toISOString()}, before the job started at ${config.jobStartedAt.toISOString()} — this is a leftover report, not a fresh run.`,
    });
  }

  for (const artifact of config.requiredArtifacts ?? []) {
    if (!existsSync(artifact)) {
      signals.push({
        code: "MISSING_ARTIFACT",
        message: `Expected artifact not found: ${artifact}`,
      });
    }
  }

  return { ok: signals.length === 0, signals, caseCount, avgDurationSeconds };
}
