# Pi-worker playground → Todo App

A client-side to-do web app (issue #30): add, complete, edit and delete tasks, set reminders,
filter/sort, and manage recurring tasks. Built with **React 18 + TypeScript + Vite**; data is
persisted in your browser's localStorage — no backend required.

## Features

- **Add a task** — type a title, optionally pick a due date, save with a single click of `Add`
  or by pressing Enter. Saving with an empty title is prevented with a clear inline prompt.
- **Complete a task** — tick the checkbox; completed tasks are struck through and move into the
  *Completed* section.
- **Edit a task** — `Edit` opens a modal with title, notes, due date, priority, tags, reminder
  and repeat rule.
- **Delete a task** — `Delete` asks for confirmation before removing.
- **Reminders** — pick a date/time in the editor; a scheduler checks reminders every ~30 s while
  the app is open and alerts in-app; enable browser notifications via the 🔔 button for system
  notifications.
- **Filter & sort** — filter by status (All / Active / Completed) and by tag; sort by due date
  or priority.
- **Recurring tasks** — set a *Daily / Weekly / Monthly* repeat rule; when the task is
  completed, its next occurrence is generated automatically (advanced by one interval, with
  month-end clamping, e.g. Jan 31 → Feb 28). The previous occurrence stays in *Completed*.

## Run it

```bash
npm install
npm run dev        # start the dev server (prints a localhost URL)
```

Other scripts:

```bash
npm run build      # type-check and build for production (dist/)
npm run preview    # serve the production build locally
npm test           # run the Vitest unit tests
```

## Notes & limitations

- **Data is stored in this browser only** (localStorage, versioned as `todo-app.tasks.v1`) —
  there is no account, sync or cross-device persistence.
- **Reminders fire only while the app is open.** True background push/email reminders need
  service-worker/backend infrastructure and are out of scope. If browser notifications are
  blocked or unsupported, reminders still appear as in-app banners.
- Reminder math uses your local calendar/timezone.
