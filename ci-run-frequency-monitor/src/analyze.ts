export interface RunRecord {
  startedAt: Date;
}

export type Verdict = "ok" | "crash-loop" | "stalled";

export interface AnalysisResult {
  verdict: Verdict;
  runsPerHourByBucket: Record<string, number>;
  message: string;
}

/**
 * A pipeline that reports "success" on every run can still be broken: if
 * something upstream (a webhook misconfigured to retrigger, a bad retry
 * policy) makes it run far more often than its schedule says, or if it
 * silently stops running at all, the green badge means nothing. This
 * buckets runs by hour and flags both extremes against a healthy range.
 */
export function analyzeRunFrequency(
  runs: RunRecord[],
  expectedRunsPerHour: { min: number; max: number }
): AnalysisResult {
  const buckets: Record<string, number> = {};
  for (const run of runs) {
    const bucketKey = new Date(run.startedAt).toISOString().slice(0, 13); // YYYY-MM-DDTHH
    buckets[bucketKey] = (buckets[bucketKey] ?? 0) + 1;
  }

  const counts = Object.values(buckets);
  if (counts.length === 0) {
    return { verdict: "stalled", runsPerHourByBucket: buckets, message: "No runs recorded in the observed window." };
  }

  const maxCount = Math.max(...counts);
  const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;

  if (maxCount > expectedRunsPerHour.max) {
    return {
      verdict: "crash-loop",
      runsPerHourByBucket: buckets,
      message: `Peak of ${maxCount} runs in one hour exceeds the expected maximum of ${expectedRunsPerHour.max} — likely a retry/crash loop.`,
    };
  }
  if (avgCount < expectedRunsPerHour.min) {
    return {
      verdict: "stalled",
      runsPerHourByBucket: buckets,
      message: `Average of ${avgCount.toFixed(2)} runs/hour is below the expected minimum of ${expectedRunsPerHour.min} — the pipeline may have stopped triggering.`,
    };
  }

  return { verdict: "ok", runsPerHourByBucket: buckets, message: "Run frequency is within the expected range." };
}
