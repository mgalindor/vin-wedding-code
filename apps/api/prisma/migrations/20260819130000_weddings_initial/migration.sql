-- Migration: weddings_initial (US-009).
-- Adds the `weddings` table — the canonical record a Wedding Planner
-- creates via `POST /api/v1/weddings` and the root every other wedding
-- capability (guests, invitation, photos) attaches to.
--
-- Per ARC-019 this migration is the first surface of the Wedding
-- bounded context. Per the project's lean principle (do not add tables
-- until strictly necessary) this migration deliberately ships ONLY the
-- `weddings` table — the `wedding_data` table that stores the
-- per-template invitation payload is owned end-to-end by ARC-020 /
-- US-022 and will arrive with that story, not here.
--
-- Column types match the Prisma schema `String` → TEXT mapping so the
-- generated client and the migration stay in sync (no follow-up ALTER).
--
-- Forward-only per ADR-11. No automatic rollback.

CREATE TYPE "WeddingStatus" AS ENUM ('draft', 'published', 'archived');

CREATE TABLE "weddings" (
    "id" TEXT NOT NULL,

    "tenant_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,

    "partner_1_name" TEXT NOT NULL,
    "partner_2_name" TEXT NOT NULL,
    "event_date" DATE NOT NULL,

    "venue_name" TEXT NOT NULL,
    "venue_city" TEXT NOT NULL,

    "status" "WeddingStatus" NOT NULL DEFAULT 'draft',

    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_user_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_user_id" TEXT NOT NULL,

    CONSTRAINT "weddings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_weddings_tenant_owner_status" ON "weddings"("tenant_id", "owner_user_id", "status");

CREATE INDEX "idx_weddings_tenant_owner_date" ON "weddings"("tenant_id", "owner_user_id", "event_date");