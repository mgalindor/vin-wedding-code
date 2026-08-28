INSERT INTO guest_groups
  (id, event_id, name, side, relationship, shared_email, shared_phone,
   primary_guest_id, invitation_token, display_order, created_at, updated_at)
VALUES
  ('grp-1', 'evt-1', 'Familia',  'Novia', 'family',  NULL, NULL, NULL, 'token-1', 1, '2026-08-01T10:00:00Z', '2026-08-01T10:00:00Z'),
  ('grp-2', 'evt-1', 'Amigos',   NULL,   'friends', NULL, NULL, NULL, 'token-2', 0, '2026-08-01T10:00:00Z', '2026-08-01T10:00:00Z'),
  ('grp-3', 'evt-1', 'Trabajo',  NULL,   'other',   NULL, NULL, NULL, 'token-3', 2, '2026-08-01T10:00:00Z', '2026-08-01T10:00:00Z');
