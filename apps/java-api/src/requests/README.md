# deer-planner-api — Bruno collection

End-to-end smoke scripts for the current REST API surface. Plain text, git-versioned,
runnable from CLI or the Bruno desktop app.

## Structure

One `.bru` file per request, organised in subdirectories by bounded context. Bruno
**does not** support multiple requests per file — the `###` separator you may see in
examples is the legacy v1 format and the v2 parser rejects it.

```
src/requests/
├── bruno.json
├── README.md
├── environments/
│   └── local.bru                ← {{host}}, {{adminUsername}}, {{adminPassword}}
├── auth/                        ← login + userinfo (2)
├── users/                       ← user CRUD + disable/enable (7)
├── templates/                   ← invitation templates (2)
├── events/                      ← CRUD + archive (5)
├── event-payloads/              ← locations / program / contacts (3)
├── wedding/                     ← wedding-detail + 6 payloads (8)
├── invitation-config/           ← get / put config (4)
├── guest-groups/                ← CRUD + primary + token + RSVP (8)
├── guests/                      ← CRUD + change group (7)
├── admin-rsvp/                  ← admin marks RSVP + final event cleanup (5)
└── scenarios/                   ← end-to-end regression suites (59)
    ├── manage-users/            ← 21 requests, full user lifecycle
    └── manage-event/            ← 38 requests, event + guest lifecycle
```

Each top-level folder (except `scenarios/`) has a `folder.bru` with `meta { seq: N }` that fixes
its execution order relative to its siblings when running recursively (`-r`) or via a
multi-path `bru run` invocation — folders without a `folder.bru` fall back to alphabetical
order, which does **not** match the dependency chain below (e.g. `admin-rsvp` would run before
`auth`). The order is: `auth(1) users(2) templates(3) events(4) event-payloads(5) wedding(6)
invitation-config(7) guest-groups(8) guests(9) admin-rsvp(10)`; `scenarios/` sets its own
`seq: 11` so it always runs last.

## Prerequisites

- Bruno CLI: `npm i -D @usebruno/cli` (or use the Bruno desktop app)
- The Java backend running locally on `http://localhost:8080`
- An `admin@deer` user exists after the first boot of the backend. The application
  prints a randomly generated temporary password once to its WARN log on startup — copy
  it from there, set `adminPassword` in `environments/local.bru`, and rotate the password
  through the API (`PUT /oauth/user/password`) as soon as possible.

## Run

```bash
# All files, recursively, in folder.bru seq order (must run from src/requests, the collection root)
cd src/requests
bru run . -r --env local

# The same, but as explicit ordered paths in one process (equivalent, sometimes easier to
# read in CI logs since each folder gets its own summary block)
bru run auth users templates events event-payloads wedding invitation-config guest-groups \
  guests admin-rsvp scenarios -r --env local

# One folder at a time (only reliable in isolation — see "Known limitations")
bru run auth --env local
bru run events --env local

# One file
bru run auth/00-login.bru --env local

# CI-friendly output
bru run . -r --env local --output junit > results.xml
```

## Variable sharing across files

`vars:post-response` captures the response body field into a **collection-scope** variable
that persists across files in the same run. The convention is:

```
auth/00-login.bru              vars:post-response { organizerToken: res.body.accessToken }
events/00-create.bru           uses {{organizerToken}}
                               vars:post-response { eventId: res.body.id }
wedding/00-get-detail.bru      uses {{eventId}}
...
```

You can read a captured variable inside a `tests` block via `bru.getVar("name")`.

## Conventions

- One request per file. The filename and `meta { name: ... }` describe what the request does.
- The numeric prefix (`00-`, `01-`, ...) controls execution order within a folder.
- Use `assert { res.status: eq 200 }` for shape checks. Use `tests { ... }` blocks for JS assertions.
- Public endpoints skip `auth:bearer`. Admin endpoints require it.
- `docs { ... }` blocks contain free-form markdown that Bruno displays in the UI sidebar.

## What the collection covers

| Concern | Folder | Notes |
|---|---|---|
| Authentication | `auth/` | OAuth-style password grant, JWT subject lookup |
| User management | `users/` | Admin CRUD on users + disable/enable; owner self-edit |
| Template catalogue | `templates/` | List + lookup; captures `templateId` for later |
| Event lifecycle | `events/` | Create, get, list, patch, archive (delete moved to `admin-rsvp/`, see below) |
| Generic payloads | `event-payloads/` | locations / program / contacts |
| Wedding extension | `wedding/` | top-level detail + 6 wedding payloads |
| Invitation activation | `invitation-config/` | get / activate / toggle RSVP; captures `slug` |
| Guest groups | `guest-groups/` | CRUD, primary setter (set + clear), token regen, group RSVP |
| Guests | `guests/` | CRUD, change group, captures `guestId1` / `guestId2` |
| Admin RSVP | `admin-rsvp/` | mark whole-group + individual + reset to pending + delete the shared event (final cleanup) |
| Regression scenarios | `scenarios/` | end-to-end flows: user lifecycle + event + guest lifecycle; assumes {{organizerToken}} from `auth/` |

## Known limitations

- This collection assumes one seeded admin user with `Administrator` role. Change credentials in
  `environments/local.bru` if yours differ.
- Variables set by the **first** request that captures them only persist forward — re-running
  the collection out of order will fail at the first request that depends on an un-captured var.
- `events/`, `event-payloads/`, `wedding/`, `invitation-config/`, `guest-groups/`, `guests/`, and
  `admin-rsvp/` all share the single `{{eventId}}` captured by `events/00-create.bru`. Running any
  of `event-payloads/` through `admin-rsvp/` **standalone** (without `events/` first in the same
  `bru run` invocation) will fail on the first request — the event cleanup (`DELETE
  /events/{eventId}`) intentionally lives at the very end of `admin-rsvp/`, not in `events/`, so
  that it only runs once every dependent folder is done with the event.
- Some resources' uniqueness constraints (e.g. `users.username`, invitation config `slug`) are not
  scoped to exclude soft-deleted rows at the database level, so re-running a scenario that creates
  a fixed, hardcoded value of one of these a second time against the same persistent dev database
  can fail with a "already exists" / "taken" error even though the original resource was
  "deleted". `scenarios/manage-event/19-activate-invitation.bru` works around this by generating a
  timestamped slug per run; `scenarios/manage-users` does not (its usernames are fixed test-data
  identifiers by design) — hard-delete the `miguel@deer` / `roberto@deer` rows from the database
  before re-running it if needed.
- This is NOT a replacement for the Java unit/slice tests. It is a smoke layer for end-to-end
  flows — useful for demos, manual QA, onboarding, and CI smoke runs.