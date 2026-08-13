-- Migration: identity_users_initial (ARC-008).
-- Forward-only per ADR-11. No automatic rollback.

CREATE TYPE "user_role" AS ENUM ('Administrator', 'WeddingPlanner');

CREATE TABLE "users" (
    "id" VARCHAR(10) NOT NULL,
    "tenant_id" VARCHAR(10) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "password_hash" VARCHAR(72) NOT NULL,
    "role" "user_role" NOT NULL,
    "onboarded_by_admin_id" VARCHAR(10),
    "is_disabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_users_tenant_id" ON "users"("tenant_id");

CREATE UNIQUE INDEX "idx_users_email" ON "users"("email");