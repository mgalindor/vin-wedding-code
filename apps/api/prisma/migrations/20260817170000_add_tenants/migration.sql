-- Migration: add_tenants (US-001).
-- Adds the `tenants` table so the org email suffix is sourced from
-- data (not from an env var). Sprint 1 ships exactly one row, seeded
-- by tools/db-seed.ts.
--
-- Column types match the Prisma schema `String` → TEXT mapping so the
-- generated client and the migration stay in sync (no follow-up ALTER).
--
-- Forward-only per ADR-11. No automatic rollback.

CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "email_suffix" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "idx_tenants_email_suffix" ON "tenants"("email_suffix");
