export type CaseOutcome = "passed" | "failed";

export interface HistoryEntry {
  /** Consecutive failure count right before this run. */
  consecutiveFailures: number;
  lastOutcome: CaseOutcome;
  lastUpdated: string; // ISO timestamp
}

export type HistoryStore = Record<string, HistoryEntry>;

export interface GateDecision {
  testId: string;
  outcome: CaseOutcome;
  /** true when this failure should actually block the pipeline. */
  blocking: boolean;
  consecutiveFailures: number;
}

export interface GateSummary {
  total: number;
  passed: number;
  blockingFailures: number;
  /** Failed once but not (yet) a second consecutive time — not blocking. */
  warnings: number;
  flakyRate: number; // warnings / total
}
