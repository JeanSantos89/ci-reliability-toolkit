import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { CaseOutcome, GateDecision, HistoryStore } from "./types.js";

/**
 * Minimal JSON-file-backed history store. Good enough for a single CI
 * runner with a persisted workspace between runs. Swap for SQLite/Redis
 * if you need concurrent writers.
 */
export class HistoryStoreFile {
  private store: HistoryStore = {};

  constructor(private readonly filePath: string) {
    if (existsSync(filePath)) {
      this.store = JSON.parse(readFileSync(filePath, "utf-8"));
    }
  }

  /**
   * Records the outcome of a test case and returns whether this result
   * should block the pipeline: only a SECOND consecutive failure blocks.
   * A pass resets the streak. A single failure is a warning, not a block.
   */
  record(testId: string, outcome: CaseOutcome): GateDecision {
    const previous = this.store[testId];
    const previousConsecutiveFailures = previous?.consecutiveFailures ?? 0;

    const consecutiveFailures = outcome === "failed" ? previousConsecutiveFailures + 1 : 0;
    const blocking = outcome === "failed" && consecutiveFailures >= 2;

    this.store[testId] = {
      consecutiveFailures,
      lastOutcome: outcome,
      lastUpdated: new Date().toISOString(),
    };

    return { testId, outcome, blocking, consecutiveFailures };
  }

  save(): void {
    writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), "utf-8");
  }
}
