// Tunable thresholds for the Terminus health indicators. Exported so
// the backend runbook (OPS-029) can document them in one place and
// the on-call can retune without grepping the code.
export const HEALTH_MEMORY_HEAP_LIMIT_BYTES = 200 * 1024 * 1024; // 200 MB
export const HEALTH_MEMORY_RSS_LIMIT_BYTES = 300 * 1024 * 1024; // 300 MB
export const HEALTH_DISK_THRESHOLD_PERCENT = 0.9; // 90 % used
export const HEALTH_PRISMA_TIMEOUT_MS = 1_000;

// Disk path to check. On Windows the root path '/' is invalid;
// the check-disk-space library requires a Windows-style path (e.g. 'C:\').
// On POSIX systems '/' is the correct root.
export const HEALTH_DISK_PATH =
  process.platform === 'win32' ? 'C:\\' : '/';
