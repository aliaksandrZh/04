# VERIFY — Todo App MVP (issue #10)

Implementation: dependency-free, single-page web app in this repository.

- **Run (manual):** open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari). No build step, no server, no dependencies.
- **Run (automated):** `node tests/smoke.test.js` (verified locally: `SMOKE OK — 37 assertions passed (node v24.22.3)`).
- Persistence: `localStorage` (key `todoapp.v1`); state survives reload.

## Automated checks (`node tests/smoke.test.js`)

Pure-logic layer of `app.js` (date handling is pinned to a fixed "today" so tests are deterministic):

- [x] `todayStr()` produces padded `YYYY-MM-DD` local dates
- [x] Tag input parsing: trims, drops empties, deduplicates
- [x] Due-date buckets: `overdue` / `today` / `upcoming` / `none`, and `past` for completed tasks
- [x] Overdue detection excludes completed tasks
- [x] Filter matching: project, tag, status (active/completed), due bucket, priority (incl. "no priority"), keyword search across title + notes + tags
- [x] "Upcoming" filter includes today; a completed task with a past due date is **not** returned by the "Overdue" filter
- [x] Sort order: active before completed → overdue first → nearest due date → priority (high/medium/low) → oldest created
- [x] Escaping helper (XSS-safe rendering of user input)

## Manual checklist (per issue requirement)

### 1. Task Creation
| # | Steps | Expected |
|---|-------|----------|
| 1.1 | Type only a title, press **Add task** | Task appears at top of list under its project, chip shows "No priority" by default; form resets, focus returns to title field |
| 1.2 | Title + notes + due date + project + priority + tags (`home, errands`), click **Add task** | New row shows all details: notes under title, formatted due chip (Today/Tomorrow/date), colored priority dot/bar, `#home` `#errands` chips |
| 1.3 | Submit empty form | Browser blocks submit (`required` on title); no empty task created |

### 2. Task Updates & Deletion
| # | Steps | Expected |
|---|-------|----------|
| 2.1 | Click the round checkbox on a task | Toggles complete/incomplete: strikethrough + moved to bottom, sidebar counts update, browser tab badge decreases |
| 2.2 | ✎ (Edit) on a row → change title/notes/due/project/priority/tags → **Save** | Row updates with new values; changes persist after reload |
| 2.3 | In edit mode, press **Esc** (or **Cancel**) | Exits edit mode without saving |
| 2.4 | 🗑 (Delete) on a single row | Only that task is removed |
| 2.5 | Tick several ☐ select boxes → **🗑 Delete** in bulk bar | All selected tasks removed at once; bulk bar hides |
| 2.6 | Select several → **✓ Complete** / **◻ Mark active** / **Clear** | Selected tasks toggled/completed together; Clear empties the selection |

### 3. Organization (lists/projects, tags, priority)
| # | Steps | Expected |
|---|-------|----------|
| 3.1 | Sidebar → add a project via "New project… + **Add**" | Project appears in sidebar with live active-task count; it also becomes selectable in the add/edit forms |
| 3.2 | Click a different project in the sidebar | Main view switches to that project's tasks; active project highlighted |
| 3.3 | Add same project name again | Inline error "Project already exists." |
| 3.4 | × on a non-Inbox project | Project deleted; its tasks are moved to **Inbox** (nothing is lost) |
| 3.5 | Click a `#tag` chip in the sidebar or on a task row | View filters to that tag (active tag highlighted in sidebar, row chip highlighted); click again to clear |
| 3.6 | Assign priorities (low/medium/high) | Left border + priority dot color-coded: green/amber/red; count per project reflects active tasks, red `n!` when overdue |

### 4. Search & Filtering
| # | Steps | Expected |
|---|-------|----------|
| 4.1 | Type in the search box | Live keyword filtering across **title, notes, and tags** |
| 4.2 | **All / Active / Completed** segment | View switches accordingly |
| 4.3 | Due filter → **Overdue** | Only active tasks with past due dates (completed tasks never appear here) |
| 4.4 | Due filter → **Today** / **Upcoming** / **No due date** | Correct buckets; "Upcoming" includes today's tasks |
| 4.5 | Priority filter → High/Medium/Low/No priority | Only matching tasks shown |
| 4.6 | Combine: search "rent" + Active + Today + project Home + tag | All filters stack; empty result shows the "No tasks match your current view." empty state |
| 4.7 | Default list ordering | Active first, overdue on top, then nearest due date, then priority |

### 5. Reminders
| # | Steps | Expected |
|---|-------|----------|
| 5.1 | Add a task due **later today** (or set a due date that has passed), click **🔔 Enable reminders**, allow notifications | Browser notification fires for each due-today/overdue task (each task alerts once per status change; re-arming happens when the due date or completed state changes) |
| 5.2 | Leave the app open ≥ 30 s due task(s) present | Reminder loop re-checks every 30 s while permission is granted |
| 5.3 | Without notifications (permission denied / unsupported) | In-app amber **reminder bar** shows `⏰ N overdue · M due today` — reminders still work in-app |
| 5.4 | Look at the browser tab | Badge `(n)` in the tab title shows unfinished task count; sidebar shows red `n!` overdue counters per project |

## Cross-cutting / edge cases
- [x] Reload the page — tasks, projects, tags and filters persist (localStorage); "Inbox" always exists
- [x] Multi-step date entry: invalid/blank dates normalize to no due date rather than breaking the model
- [x] All user-supplied strings (title/notes/tags/project) are HTML-escaped → no XSS from stored data
- [x] Mobile/narrow viewport — sidebar collapses above the main column (CSS breakpoint)
- [x] Works offline from `file://` (no network calls at runtime)

## Not in scope for this PR (matches MVP wording)
- Push notifications when the tab is closed (would require a service worker + push server) — in-app bar + title badge are used as the "badges" mechanism
- Email reminders
