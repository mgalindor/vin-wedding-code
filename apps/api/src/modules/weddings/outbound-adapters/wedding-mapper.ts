import { WeddingStatus } from '@wendy/contracts';
import type { WeddingDto, WeddingId } from '@wendy/contracts';

import type { TenantId, UserId } from '../../../shared/jwt/jwt.service';

// Shape returned by Prisma's `select` on the weddings table — the
// adapter's internal projection. Not exposed to the application.
export interface WeddingRow {
  id: string;
  tenant_id: string;
  owner_user_id: string;
  partner_1_name: string;
  partner_2_name: string;
  event_date: Date;
  venue_name: string;
  venue_city: string;
  status: string;
  created_at: Date;
  created_by_user_id: string;
  updated_at: Date;
  updated_by_user_id: string;
}

// `event_date` is a DATE column → projection is timezone-neutral.
function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toWeddingDto(row: WeddingRow): WeddingDto {
  return {
    id: row.id as WeddingId,
    tenantId: row.tenant_id as TenantId,
    ownerUserId: row.owner_user_id as UserId,
    partner1Name: row.partner_1_name,
    partner2Name: row.partner_2_name,
    eventDate: toIsoDate(row.event_date),
    venueName: row.venue_name,
    venueCity: row.venue_city,
    status: row.status as WeddingStatus,
    createdAt: row.created_at.toISOString(),
    createdByUserId: row.created_by_user_id as UserId,
  };
}
