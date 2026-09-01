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
├── templates/                   ← invitation templates (2)
├── events/                      ← CRUD + archive (6)
├── event-payloads/              ← locations / program / contacts (3)
├── wedding/                     ← wedding-detail + 6 payloads (8)
├── invitation-config/           ← get / put config (4)
├── guest-groups/                ← CRUD + primary + token + RSVP (8)
├── guests/                      ← CRUD + change group (7)
├── admin-rsvp/                  ← admin marks RSVP (4)
└── public-flow/                 ← public reads + RSVP submit (8)
```

Total: 51 requests.

## Prerequisites

- Bruno CLI: `npm i -D @usebruno/cli` (or use the Bruno desktop app)
- The Java backend running locally on `http://localhost:8080`
- A seeded user (`admin@deer` / `changeMe!`) — replace the placeholder password hash via
  your bootstrap endpoint or direct DB update before first run

## Run

```bash
# All files in alphabetical / folder order, sharing variables across files
bru run src/requests --env local

# One folder at a time
bru run src/requests/auth --env local
bru run src/requests/events --env local

# One file
bru run src/requests/auth/00-login.bru --env local

# CI-friendly output
bru run src/requests --env local --output junit > results.xml
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
| Template catalogue | `templates/` | List + lookup; captures `templateId` for later |
| Event lifecycle | `events/` | Create, get, list, patch, archive, delete |
| Generic payloads | `event-payloads/` | locations / program / contacts |
| Wedding extension | `wedding/` | top-level detail + 6 wedding payloads |
| Invitation activation | `invitation-config/` | get / activate / toggle RSVP; captures `slug` |
| Guest groups | `guest-groups/` | CRUD, primary setter (set + clear), token regen, group RSVP |
| Guests | `guests/` | CRUD, change group, captures `guestId1` / `guestId2` |
| Admin RSVP | `admin-rsvp/` | mark whole-group + individual + reset to pending |
| Public flow | `public-flow/` | landing + group view + per-guest RSVP submit + 4 error cases |

## Known limitations

- This collection assumes one seeded admin user with `Administrator` role. Change credentials in
  `environments/local.bru` if yours differ.
- Variables set by the **first** request that captures them only persist forward — re-running
  the collection out of order will fail at the first request that depends on an un-captured var.
- This is NOT a replacement for the Java unit/slice tests. It is a smoke layer for end-to-end
  flows — useful for demos, manual QA, onboarding, and CI smoke runs.