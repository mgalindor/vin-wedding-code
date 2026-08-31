INSERT INTO guest_groups
  (id, event_id, name, relationship, shared_email, shared_phone,
   primary_guest_id, invitation_token, display_order, created_at, updated_at, deleted)
VALUES
  ('grp-1', 'evt-1', 'Familia', 'family', NULL, NULL, NULL, 'token-1', 0,
   '2026-08-01T10:00:00Z', '2026-08-01T10:00:00Z', false);