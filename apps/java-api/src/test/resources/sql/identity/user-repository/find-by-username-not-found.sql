-- No users inserted; this test asserts that findByUsername returns Optional.empty.
-- Spring's Sql runner rejects empty scripts, so we add a no-op SELECT that H2 can execute.
SELECT 1 WHERE 1 = 0;
