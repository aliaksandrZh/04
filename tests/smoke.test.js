/* Node smoke tests for the pure logic in app.js (no DOM required).
 * Run: node tests/smoke.test.js
 */
"use strict";

const assert = require("assert");
const { todayStr, normalizeTags, dueBucket, isOverdue, matchesFilters, sortTasks, formatDue, uid, esc } = require("../app.js");

const TODAY = "2026-11-19"; // fixed "today" for deterministic assertions
let passed = 0;
const ok = () => passed++;

/* --- todayStr pads month and day --- */
assert.strictEqual(todayStr(new Date(2026, 10, 19, 23, 59)), "2026-11-19"); ok();
assert.strictEqual(todayStr(new Date(2026, 0, 2, 0, 5)), "2026-01-02"); ok();

/* --- tag normalization: trim, drop empties, dedupe --- */
assert.deepStrictEqual(normalizeTags(" home , rent, home,, "), ["home", "rent"]); ok();
assert.deepStrictEqual(normalizeTags(""), []); ok();
assert.deepStrictEqual(normalizeTags(null), []); ok();

/* --- due buckets --- */
assert.strictEqual(dueBucket({ due: null, completed: false }, TODAY), "none"); ok();
assert.strictEqual(dueBucket({ due: "2026-11-18", completed: false }, TODAY), "overdue"); ok();
assert.strictEqual(dueBucket({ due: TODAY, completed: false }, TODAY), "today"); ok();
assert.strictEqual(dueBucket({ due: "2026-11-20", completed: false }, TODAY), "upcoming"); ok();
assert.strictEqual(dueBucket({ due: "2026-11-18", completed: true }, TODAY), "past"); ok();
assert.strictEqual(formatDue("2026-11-19", TODAY), "Today"); ok();

/* --- overdue detection --- */
assert.strictEqual(isOverdue({ due: "2026-11-18", completed: false }, TODAY), true); ok();
assert.strictEqual(isOverdue({ due: "2026-11-18", completed: true }, TODAY), false); ok();
assert.strictEqual(isOverdue({ due: null, completed: false }, TODAY), false); ok();

/* --- filter matching --- */
const t = {
  id: "1", title: "Pay rent", notes: "via bank transfer", due: "2026-11-19",
  project: "Home", priority: "high", tags: ["finance"], completed: false,
};
const ALL = { project: "", tag: null, status: "all", due: "all", priority: "", search: "" };

assert.strictEqual(matchesFilters(t, ALL, TODAY), true); ok();
assert.strictEqual(matchesFilters(t, { ...ALL, project: "Home" }, TODAY), true); ok();
assert.strictEqual(matchesFilters(t, { ...ALL, project: "Work" }, TODAY), false); ok();
assert.strictEqual(matchesFilters(t, { ...ALL, tag: "finance" }, TODAY), true); ok();
assert.strictEqual(matchesFilters(t, { ...ALL, tag: "work" }, TODAY), false); ok();
assert.strictEqual(matchesFilters(t, { ...ALL, status: "active" }, TODAY), true); ok();
assert.strictEqual(matchesFilters(t, { ...ALL, status: "completed" }, TODAY), false); ok();
assert.strictEqual(matchesFilters(t, { ...ALL, due: "today" }, TODAY), true); ok();
assert.strictEqual(matchesFilters(t, { ...ALL, due: "overdue" }, TODAY), false); ok();
assert.strictEqual(matchesFilters(t, { ...ALL, due: "upcoming" }, TODAY), true); ok(); // "Upcoming" includes today
assert.strictEqual(matchesFilters(t, { ...ALL, due: "none" }, TODAY), false); ok();
assert.strictEqual(matchesFilters(t, { ...ALL, priority: "high" }, TODAY), true); ok();
assert.strictEqual(matchesFilters(t, { ...ALL, priority: "low" }, TODAY), false); ok();
assert.strictEqual(matchesFilters(t, { ...ALL, priority: "none" }, TODAY), false); ok();
assert.strictEqual(matchesFilters(t, { ...ALL, search: "rent" }, TODAY), true); ok();    // title
assert.strictEqual(matchesFilters(t, { ...ALL, search: "bank" }, TODAY), true); ok();    // notes
assert.strictEqual(matchesFilters(t, { ...ALL, search: "finance" }, TODAY), true); ok(); // tags
assert.strictEqual(matchesFilters(t, { ...ALL, search: "zilch" }, TODAY), false); ok();

/* completed task with past due date is NOT counted as overdue */
const doneLate = { ...t, completed: true, due: "2026-11-18" };
assert.strictEqual(matchesFilters(doneLate, { ...ALL, due: "overdue" }, TODAY), false); ok();
assert.strictEqual(matchesFilters(doneLate, { ...ALL, status: "completed" }, TODAY), true); ok();

/* --- sorting: active before completed, due dates, priority --- */
const later = (iso) => new Date(new Date(iso).getTime() + 1000).toISOString();
const a = { id: "a", completed: false, due: "2026-11-10", priority: "low", createdAt: "2026-11-19T00:00:00Z" };  // active overdue
const b = { id: "b", completed: false, due: "2026-11-19", priority: "high", createdAt: "2026-11-19T00:00:00Z" }; // due today
const c = { id: "c", completed: false, due: null, priority: "medium", createdAt: "2026-11-19T00:00:00Z" };      // no due date
const d = { id: "d", completed: true, due: "2026-11-10", priority: "high", createdAt: "2026-11-19T00:00:00Z" }; // done
const e = { id: "e", completed: false, due: "2026-11-19", priority: "high", createdAt: later("2026-11-19T00:00:00Z") };
const sorted = [d, c, e, b, a].sort(sortTasks);
assert.deepStrictEqual(sorted.map((x) => x.id), ["a", "b", "e", "c", "d"]); ok();

/* --- misc helpers --- */
assert.ok(uid().length > 5); ok();
assert.strictEqual(esc("<a href=\"x\">"), "&lt;a href=&quot;x&quot;&gt;"); ok();

console.log(`SMOKE OK — ${passed} assertions passed (node ${process.version})`);
