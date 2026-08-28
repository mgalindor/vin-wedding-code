-- No rows; verifies the repository returns Optional.empty() for an unknown ID.
-- H2 requires a non-empty script, so we add a no-op query.
SELECT 1 WHERE 1 = 0;
