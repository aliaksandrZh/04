/* Todo App — MVP implementation for issue #10.
 *
 * Covers: task creation (title/notes/due date), edit + complete + single/bulk
 * delete, organization via projects/tags/priority, search & filtering
 * (keyword, status, Today/Upcoming/Overdue, priority), and reminders
 * (Web Notifications + in-app reminder bar + browser-tab badge).
 *
 * Data persists in localStorage. No dependencies, no build step.
 */
"use strict";

const STORAGE_KEY = "todoapp.v1";
const APP_TITLE = "Todo App";
const PRIORITY_RANK = { high: 0, medium: 1, low: 2, "": 3 };

let state = {
  tasks: [],
  projects: ["Inbox"],
  view: { project: "", tag: null, status: "all", due: "all", priority: "", search: "" },
  selection: [],
  editingId: null,
};

/* ---------------------------------------------------------------- utilities */

function pad2(n) { return String(n).padStart(2, "0"); }

function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function normalizeTags(input) {
  return Array.from(new Set(
    (input || "").split(",").map((t) => t.trim()).filter(Boolean)
  ));
}

function uid() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/* A task is overdue when it is active and its due date is in the past. */
function isOverdue(task, today = todayStr()) {
  return !!task.due && !task.completed && task.due < today;
}

/* Date bucket of a task's due date. Completed tasks with past dates are
 * bucketed as "past" (they no longer belong in "Overdue" views). */
function dueBucket(task, today = todayStr()) {
  if (!task.due) return "none";
  if (task.due === today) return "today";
  if (task.due < today) return task.completed ? "past" : "overdue";
  return "upcoming";
}

function formatDue(due, today = todayStr()) {
  if (due === today) return "Today";
  const tomorrow = todayStr(new Date(new Date(today + "T00:00:00").getTime() + 86400000));
  if (due === tomorrow) return "Tomorrow";
  const d = new Date(due + "T00:00:00");
  if (isNaN(d)) return due;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dueLabel(task) {
  let label = formatDue(task.due);
  if (dueBucket(task) === "overdue") label = "Overdue · " + label;
  return label;
}

function matchesFilters(task, view, today = todayStr()) {
  if (view.project && (task.project || "Inbox") !== view.project) return false;
  if (view.tag && !task.tags.includes(view.tag)) return false;
  if (view.status === "active" && task.completed) return false;
  if (view.status === "completed" && !task.completed) return false;
  if (view.due !== "all") {
    const bucket = dueBucket(task, today);
    if (view.due === "upcoming") { if (bucket !== "upcoming" && bucket !== "today") return false; }
    else if (bucket !== view.due) return false;
  }
  if (view.priority) {
    const p = view.priority === "none" ? null : view.priority;
    if ((task.priority || null) !== p) return false;
  }
  if (view.search) {
    const q = view.search.toLowerCase();
    const hay = (task.title + " " + (task.notes || "") + " " + task.tags.join(" ")).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sortTasks(a, b) {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;           // active first
  const ao = isOverdue(a), bo = isOverdue(b);
  if (ao !== bo) return ao ? -1 : 1;                                      // overdue first
  const ad = a.due || "9999-12-31", bd = b.due || "9999-12-31";
  if (ad !== bd) return ad < bd ? -1 : 1;                                 // nearest due first
  const ra = PRIORITY_RANK[a.priority || ""], rb = PRIORITY_RANK[b.priority || ""];
  if (ra !== rb) return ra - rb;                                          // high → low priority
  return (a.createdAt || "") <= (b.createdAt || "") ? -1 : 1;             // oldest first
}

/* ------------------------------------------------------------------ storage */

function save() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: state.tasks, projects: state.projects }));
  } catch (e) { console.warn("Could not save state", e); }
}

function load() {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!raw) return;
    state.tasks = Array.isArray(raw.tasks) ? raw.tasks.filter(Boolean) : [];
    state.projects = Array.isArray(raw.projects) && raw.projects.length ? raw.projects : ["Inbox"];
    if (!state.projects.includes("Inbox")) state.projects.unshift("Inbox");
  } catch (e) { console.warn("Could not load saved state", e); }
}

/* --------------------------------------------------------------------- CRUD */

function addTask(fields) {
  const title = (fields.title || "").trim();
  if (!title) return null;
  const now = new Date().toISOString();
  const task = {
    id: uid(),
    title,
    notes: (fields.notes || "").trim(),
    due: fields.due && /^\d{4}-\d{2}-\d{2}$/.test(fields.due) ? fields.due : null,
    project: fields.project && state.projects.includes(fields.project) ? fields.project : "Inbox",
    priority: ["low", "medium", "high"].includes(fields.priority) ? fields.priority : null,
    tags: normalizeTags(fields.tags),
    completed: false,
    createdAt: now,
    updatedAt: now,
    remindedAt: null,
  };
  state.tasks.push(task);
  save();
  return task;
}

function updateTask(id, fields) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return null;
  if (fields.title !== undefined) {
    const title = (fields.title || "").trim();
    if (!title) return null;
    task.title = title;
  }
  if (fields.notes !== undefined) task.notes = String(fields.notes).trim();
  if (fields.due !== undefined) {
    const due = fields.due && /^\d{4}-\d{2}-\d{2}$/.test(fields.due) ? fields.due : null;
    if (due !== task.due) task.remindedAt = null; // re-arm reminders when due date changes
    task.due = due;
  }
  if (fields.project !== undefined && state.projects.includes(fields.project)) {
    task.project = fields.project;
  }
  if (fields.priority !== undefined) {
    task.priority = ["low", "medium", "high"].includes(fields.priority) ? fields.priority : null;
  }
  if (fields.tags !== undefined) task.tags = normalizeTags(fields.tags);
  task.updatedAt = new Date().toISOString();
  save();
  return task;
}

function deleteTasks(ids) {
  state.tasks = state.tasks.filter((t) => !ids.includes(t.id));
  state.selection = state.selection.filter((id) => ids.includes(id) === false);
  if (state.editingId && ids.includes(state.editingId)) state.editingId = null;
  save();
  return true;
}

function setCompleted(ids, done) {
  const now = new Date().toISOString();
  state.tasks.forEach((t) => {
    if (ids.includes(t.id) && t.completed !== done) {
      t.completed = done;
      t.remindedAt = null;
      t.updatedAt = now;
    }
  });
  save();
  return true;
}

function addProject(name) {
  const clean = (name || "").trim();
  if (!clean) return { ok: false, error: "Name is required." };
  if (state.projects.some((p) => p.toLowerCase() === clean.toLowerCase())) {
    return { ok: false, error: `Project “${clean}” already exists.` };
  }
  state.projects.push(clean);
  save();
  return { ok: true };
}

function deleteProject(name) {
  if (!name || name === "Inbox") return false;
  state.projects = state.projects.filter((p) => p !== name);
  state.tasks.forEach((t) => {
    if ((t.project || "Inbox") === name) {
      t.project = "Inbox";
      t.updatedAt = new Date().toISOString();
    }
  });
  if (state.view.project === name) state.view.project = "";
  save();
  return true;
}

function projectStats(key) {
  const inProject = state.tasks.filter((t) => (key === "" ? true : (t.project || "Inbox") === key));
  const active = inProject.filter((t) => !t.completed);
  const overdue = active.filter((t) => isOverdue(t));
  return { total: inProject.length, active: active.length, overdue: overdue.length };
}

/* ----------------------------------------------------------------- templates */

function projectOptionsHtml(selected) {
  return state.projects
    .map((p) => `<option value="${esc(p)}"${p === selected ? " selected" : ""}>${esc(p)}</option>`)
    .join("");
}

function priorityOptionsHtml(selected) {
  return [
    ["", "No priority"], ["low", "Low"], ["medium", "Medium"], ["high", "High"],
  ].map(([v, l]) => `<option value="${v}"${(selected || "") === v ? " selected" : ""}>${l}</option>`)
    .join("");
}

function taskRowHtml(task) {
  if (state.editingId === task.id) {
    return `<li class="task editing" data-id="${esc(task.id)}">
      <form class="edit-form">
        <div class="edit-grid">
          <input name="title" type="text" required value="${esc(task.title)}" autocomplete="off" aria-label="Edit title">
          <textarea name="notes" rows="2" aria-label="Edit notes">${esc(task.notes || "")}</textarea>
          <input name="due" type="date" value="${esc(task.due || "")}" aria-label="Edit due date">
          <select name="project" aria-label="Edit project">${projectOptionsHtml(task.project || "Inbox")}</select>
          <select name="priority" aria-label="Edit priority">${priorityOptionsHtml(task.priority)}</select>
          <input name="tags" type="text" value="${esc(task.tags.join(", "))}" placeholder="tags, comma-separated" aria-label="Edit tags">
        </div>
        <div class="edit-actions">
          <button class="btn btn-primary" type="submit">Save</button>
          <button class="btn btn-ghost" type="button" data-action="cancel">Cancel</button>
        </div>
      </form>
    </li>`;
  }

  const selected = state.selection.includes(task.id);
  const bucket = task.due ? dueBucket(task) : null;
  const projectChip = state.view.project === ""
    ? `<span class="chip chip-project">${esc(task.project || "Inbox")}</span>` : "";
  const dueChip = task.due
    ? `<span class="chip chip-due ${task.completed ? "chip-muted" : "chip-" + bucket}">${esc(dueLabel(task))}</span>` : "";
  const tagChips = task.tags.length
    ? task.tags.map((tag) => `<span class="chip chip-tag tag-chip" data-tag="${esc(tag)}">#${esc(tag)}</span>`).join("") : "";
  return `<li class="task${task.completed ? " completed" : ""}${task.priority ? " prio-" + task.priority : ""}" data-id="${esc(task.id)}">
    <div class="task-row">
      <input type="checkbox" class="cb-select" title="Select task" aria-label="Select task" ${selected ? "checked" : ""}>
      <input type="checkbox" class="cb-done" title="Toggle complete" aria-label="Toggle complete" ${task.completed ? "checked" : ""}>
      <span class="prio prio-${task.priority || "none"}" title="Priority: ${task.priority || "none"}"></span>
      <div class="task-main">
        <span class="task-title">${esc(task.title)}</span>
        <span class="chips">${projectChip}${dueChip}${tagChips}</span>
        ${task.notes ? `<div class="task-notes">${esc(task.notes)}</div>` : ""}
      </div>
      <div class="task-actions">
        <button class="icon-btn" data-action="edit" title="Edit task" aria-label="Edit task">✎</button>
        <button class="icon-btn danger" data-action="delete" title="Delete task" aria-label="Delete task">🗑</button>
      </div>
    </div>
  </li>`;
}

/* ---------------------------------------------------------------- rendering */

function renderProjects() {
  const nav = document.getElementById("project-list");
  if (!nav) return;
  const items = [["", "All"]].concat(state.projects.map((p) => [p, p]));
  nav.innerHTML = items.map(([key, label]) => {
    const st = projectStats(key);
    const active = state.view.project === key ? " active" : "";
    const count = `<span class="count${st.overdue ? " overdue" : ""}" title="${st.overdue} overdue">${st.overdue ? st.overdue + "!" : st.active}</span>`;
    const del = key && key !== "Inbox"
      ? `<button class="icon-btn danger" data-action="delete-project" data-project="${esc(key)}" title="Delete project" aria-label="Delete project ${esc(key)}">×</button>` : "";
    return `<li class="project-item${active}" data-project="${esc(key)}">
      <span class="proj-name">${esc(label)}</span>${count}${del}</li>`;
  }).join("");

  const sel = document.getElementById("f-project");
  if (sel) {
    const current = state.projects.includes(sel.value) ? sel.value
      : (state.view.project && state.projects.includes(state.view.project) ? state.view.project : "Inbox");
    sel.innerHTML = projectOptionsHtml(current);
    sel.value = current;
  }
}

function renderTags() {
  const nav = document.getElementById("tag-list");
  if (!nav) return;
  const counts = new Map();
  state.tasks.forEach((t) => t.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
  const tags = Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  nav.innerHTML = tags.length
    ? tags.map(([tag, n]) =>
      `<li class="tag-item${state.view.tag === tag ? " active" : ""}" data-tag="${esc(tag)}">
        <span class="proj-name">#${esc(tag)}</span><span class="count">${n}</span></li>`).join("")
    : `<div class="muted small">No tags yet</div>`;
}

function renderTasks() {
  const list = document.getElementById("task-list");
  if (!list) return;
  const tasks = state.tasks.filter((t) => matchesFilters(t, state.view)).sort(sortTasks);
  if (state.editingId && !tasks.some((t) => t.id === state.editingId)) state.editingId = null;
  list.innerHTML = tasks.map(taskRowHtml).join("");
  const empty = document.getElementById("empty-state");
  if (empty) empty.classList.toggle("hidden", tasks.length > 0);
}

function renderBulk() {
  const bar = document.getElementById("bulkbar");
  if (!bar) return;
  const n = state.selection.length;
  bar.classList.toggle("hidden", n === 0);
  const count = document.getElementById("bulk-count");
  if (count) count.textContent = `${n} selected`;
  ["bulk-complete", "bulk-active", "bulk-delete"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = n === 0;
  });
}

function renderReminders() {
  const bar = document.getElementById("reminder-bar");
  if (!bar) return;
  const today = todayStr();
  const overdue = state.tasks.filter((t) => isOverdue(t, today)).length;
  const dueToday = state.tasks.filter((t) => !t.completed && t.due === today).length;
  const supported = typeof Notification !== "undefined";
  const enabled = supported && Notification.permission === "granted";
  if (overdue || dueToday) {
    const parts = [];
    if (overdue) parts.push(`<strong>${overdue}</strong> overdue`);
    if (dueToday) parts.push(`<strong>${dueToday}</strong> due today`);
    bar.innerHTML = `⏰ ${parts.join(" · ")}` +
      (enabled ? "" : " — enable browser reminders in the sidebar for alerts while the app is open.");
    bar.classList.remove("hidden");
  } else {
    bar.classList.add("hidden");
    bar.innerHTML = "";
  }
}

function updateTitleBadge() {
  const n = state.tasks.filter((t) => !t.completed).length;
  document.title = (n > 0 ? `(${n}) ` : "") + APP_TITLE;
}

function render() {
  renderProjects();
  renderTags();
  renderTasks();
  renderBulk();
  renderReminders();
  updateTitleBadge();
}

/* --------------------------------------------------------------- reminders */

function checkReminders() {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const today = todayStr();
  let changed = false;
  for (const task of state.tasks) {
    if (task.completed || !task.due || task.remindedAt) continue;
    const bucket = dueBucket(task, today);
    if (bucket === "today" || bucket === "overdue") {
      const body = bucket === "overdue"
        ? `Overdue since ${formatDue(task.due, today)}.`
        : `Due ${formatDue(task.due, today).toLowerCase()}.`;
      try {
        new Notification(`Todo: ${task.title}`, { body, tag: "todo-" + task.id });
      } catch (e) { /* some browsers require a service worker; in-app bar still covers this */ }
      task.remindedAt = new Date().toISOString();
      changed = true;
    }
  }
  if (changed) save();
}

function updateNotifyUi(perm) {
  const btn = document.getElementById("notify-btn");
  const status = document.getElementById("notify-status");
  if (!btn || !status) return;
  if (perm === "unsupported") { btn.disabled = true; status.textContent = "Notifications not supported in this browser."; return; }
  if (perm === "granted") { btn.textContent = "🔔 Reminders on"; btn.disabled = true; status.textContent = "Alerts enabled — tasks due today or overdue trigger a notification while the app is open."; return; }
  if (perm === "denied") { btn.disabled = true; status.textContent = "Notifications are blocked (allow them in browser settings); the in-app reminder bar still shows due/overdue counts."; return; }
  status.textContent = "Browser alerts for tasks due today or overdue.";
}

/* ------------------------------------------------------------------- events */

function bindEvents() {
  const $ = (id) => document.getElementById(id);

  /* Add task */
  $("task-form").addEventListener("submit", (e) => {
    e.preventDefault();
    addTask({
      title: $("f-title").value,
      notes: $("f-notes").value,
      due: $("f-due").value,
      project: $("f-project").value,
      priority: $("f-priority").value,
      tags: $("f-tags").value,
    });
    e.target.reset();
    $("f-priority").value = "";
    render();
    $("f-title").focus();
  });

  /* Toolbar */
  $("search").addEventListener("input", (e) => {
    state.view.search = e.target.value.trim();
    renderTasks();
  });
  $("status-filter").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-status]");
    if (!btn) return;
    state.view.status = btn.dataset.status;
    render();
  });
  $("due-filter").addEventListener("change", (e) => {
    state.view.due = e.target.value;
    renderTasks();
  });
  $("priority-filter").addEventListener("change", (e) => {
    state.view.priority = e.target.value;
    renderTasks();
  });

  /* Task list (event delegation) */
  const list = $("task-list");
  list.addEventListener("click", (e) => {
    const actionBtn = e.target.closest("button[data-action]");
    if (actionBtn) {
      const li = actionBtn.closest("li.task");
      const id = li && li.dataset.id;
      if (actionBtn.dataset.action === "edit" && id) {
        state.editingId = state.editingId === id ? null : id;
        render();
      } else if (actionBtn.dataset.action === "cancel") {
        state.editingId = null;
        render();
      } else if (actionBtn.dataset.action === "delete" && id) {
        deleteTasks([id]);
        render();
      }
      return;
    }
    const tagChip = e.target.closest(".tag-chip");
    if (tagChip) {
      const tag = tagChip.dataset.tag;
      state.view.tag = state.view.tag === tag ? null : tag;
      render();
    }
  });
  list.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target.closest("form.edit-form");
    if (!form) return;
    const id = form.closest("li.task").dataset.id;
    const f = form.elements;
    updateTask(id, {
      title: f.title.value,
      notes: f.notes.value,
      due: f.due.value || null,
      project: f.project.value,
      priority: f.priority.value || null,
      tags: f.tags.value,
    });
    state.editingId = null;
    render();
  });
  list.addEventListener("change", (e) => {
    const target = e.target;
    const li = target.closest("li.task");
    if (!li) return;
    const id = li.dataset.id;
    if (target.classList.contains("cb-done")) {
      setCompleted([id], target.checked);
      render();
    } else if (target.classList.contains("cb-select")) {
      if (target.checked) state.selection.push(id);
      else state.selection = state.selection.filter((x) => x !== id);
      renderBulk();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.editingId) {
      state.editingId = null;
      render();
    }
  });

  /* Sidebar: projects */
  $("project-list").addEventListener("click", (e) => {
    const delBtn = e.target.closest("button[data-action='delete-project']");
    if (delBtn) {
      deleteProject(delBtn.dataset.project);
      render();
      return;
    }
    const li = e.target.closest("li[data-project]");
    if (!li) return;
    state.view.project = li.dataset.project;
    state.view.tag = null;
    render();
  });
  $("add-project-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("project-error");
    err.textContent = "";
    const res = addProject($("new-project").value);
    if (!res.ok) { err.textContent = res.error; return; }
    $("new-project").value = "";
    render();
  });

  /* Sidebar: tags */
  $("tag-list").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-tag]");
    if (!li) return;
    state.view.tag = state.view.tag === li.dataset.tag ? null : li.dataset.tag;
    render();
  });

  /* Bulk actions */
  const bulk = (fn) => (e) => { e.preventDefault(); if (state.selection.length) fn(); };
  $("bulk-complete").addEventListener("click", bulk(() => {
    setCompleted(state.selection, true); state.selection = []; render();
  }));
  $("bulk-active").addEventListener("click", bulk(() => {
    setCompleted(state.selection, false); state.selection = []; render();
  }));
  $("bulk-delete").addEventListener("click", bulk(() => {
    deleteTasks(state.selection); state.selection = []; render();
  }));
  $("bulk-clear").addEventListener("click", bulk(() => {
    state.selection = []; renderBulk();
    document.querySelectorAll(".cb-select").forEach((cb) => { cb.checked = false; });
  }));

  /* Reminders */
  $("notify-btn").addEventListener("click", () => {
    if (typeof Notification === "undefined") { updateNotifyUi("unsupported"); return; }
    if (Notification.permission === "denied") { updateNotifyUi("denied"); return; }
    Notification.requestPermission().then((perm) => {
      updateNotifyUi(perm);
      if (perm === "granted") {
        try { new Notification("Reminders enabled", { body: "You'll be alerted about tasks due today or overdue." }); } catch (e) { /* ignore */ }
        checkReminders();
      }
    });
  });
}

/* --------------------------------------------------------------------- init */

function init() {
  load();
  bindEvents();
  const perm = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
  updateNotifyUi(perm);
  if (perm === "granted") {
    checkReminders();
    setInterval(checkReminders, 30000);
  }
  render();
}

/* Auto-init in the browser; the script is loaded at the end of <body>. */
if (typeof document !== "undefined" && document.getElementById("task-list")) {
  init();
}

/* Export pure helpers so automated tests can run in Node without a DOM. */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { todayStr, normalizeTags, uid, esc, isOverdue, dueBucket, formatDue, matchesFilters, sortTasks };
}
