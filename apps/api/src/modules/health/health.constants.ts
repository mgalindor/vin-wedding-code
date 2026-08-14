// Tunable thresholds for the Terminus health indicators. Exported so
// the backend runbook (OPS-029) can document them in one place and
// the on-call can retune without grepping the code.
export const HEALTH_MEMORY_HEAP_LIMIT_BYTES = 200 * 1024 * 1024; // 200 MB
export const HEALTH_MEMORY_RSS_LIMIT_BYTES = 300 * 1024 * 1024; // 300 MB
export const HEALTH_DISK_THRESHOLD_PERCENT = 0.9; // 90 % of / used
export const HEALTH_PRISMA_TIMEOUT_MS = 1_000;
