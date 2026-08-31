INSERT INTO events (id, organizer_id, event_type, title, event_date, status,
  locations_payload, program_payload, contacts_payload, created_at, updated_at, deleted)
VALUES
  ('evt-1', 'user-organizer-1', 'wedding', 'First event',  '2027-04-15', 'draft',
   NULL, NULL, NULL, '2026-08-01T09:00:00Z', '2026-08-01T09:00:00Z', false),
  ('evt-2', 'user-organizer-1', 'wedding', 'Second event', '2027-09-20', 'draft',
   NULL, NULL, NULL, '2026-08-01T10:00:00Z', '2026-08-01T10:00:00Z', false);