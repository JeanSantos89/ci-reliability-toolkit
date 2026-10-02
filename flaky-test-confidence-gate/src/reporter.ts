import type { Reporter, TestCase, TestResult, FullResult } from "@playwright/test/reporter";
import { HistoryStoreFile } from "./history.js";
import type { GateDecision, GateSummary } from "./types.js";

interface ReporterOptions {
  historyFile?: string;
}

/**
 * Custom Playwright Test reporter implementing a "confidence gate":
 * a test that fails once is logged as a warning and does not fail the
 * build. Only a SECOND consecutive failure of the same test is treated
 * as a real, blocking failure.
 *
 * Usage (playwright.config.ts):
 *   reporter: [["./dist/reporter.js", { historyFile: ".flaky-gate-history.json" }]]
 */
export default class FlakyTestConfidenceGateReporter implements Reporter {
  private readonly history: HistoryStoreFile;
  private readonly decisions: GateDecision[] = [];

  constructor(options: ReporterOptions = {}) {
    this.history = new HistoryStoreFile(options.historyFile ?? ".flaky-gate-history.json");
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const outcome = result.status === "passed" ? "passed" : "failed";
    const testId = test.titlePath().join(" > ");
    const decision = this.history.record(testId, outcome);
    this.decisions.push(decision);

    if (outcome === "failed" && !decision.blocking) {
      console.warn(`[flaky-gate] WARNING (not blocking): "${testId}" failed once. Will block only on next consecutive failure.`);
    }
    if (decision.blocking) {
      console.error(`[flaky-gate] BLOCKING: "${testId}" failed ${decision.consecutiveFailures} times in a row.`);
    }
  }

  onEnd(result: FullResult): void {
    this.history.save();

    const summary = this.summarize();
    console.log("\n[flaky-gate] Summary:");
    console.log(`  total: ${summary.total}`);
    console.log(`  passed: ${summary.passed}`);
    console.log(`  blocking failures: ${summary.blockingFailures}`);
    console.log(`  warnings (single failure, not blocking): ${summary.warnings}`);
    console.log(`  flaky rate: ${(summary.flakyRate * 100).toFixed(1)}%`);

    if (summary.blockingFailures > 0 && result.status === "passed") {
      // Playwright only exposes a mutable status via process.exitCode here.
      process.exitCode = 1;
    }
  }

  private summarize(): GateSummary {
    const total = this.decisions.length;
    const passed = this.decisions.filter((d) => d.outcome === "passed").length;
    const blockingFailures = this.decisions.filter((d) => d.blocking).length;
    const warnings = this.decisions.filter((d) => d.outcome === "failed" && !d.blocking).length;
    return {
      total,
      passed,
      blockingFailures,
      warnings,
      flakyRate: total > 0 ? warnings / total : 0,
    };
  }
}
