/**
 * dashboard.js
 * ------------------------------------------------------------------
 * Renders index.html purely from the SYSTEMS / SYSTEM_ORDER data in
 * data.js. Contains no hardcoded system content — add a system in
 * data.js and it appears here automatically.
 * ------------------------------------------------------------------
 */

const STATUS_COLOR = {
  Overdue: "var(--red)",
  "In Progress": "var(--blue)",
  Pending: "var(--amber)",
  Completed: "var(--green)",
};

function countPending(items) {
  return items.length;
}

function worstStatus(items) {
  // Decide the dot color for a system card: worst-first.
  if (items.some((i) => i.status === "Overdue")) return "Overdue";
  if (items.some((i) => i.status === "In Progress")) return "In Progress";
  if (items.some((i) => i.status === "Pending")) return "Pending";
  return "Completed";
}

function renderDashboard() {
  // Pull in anything added/edited/deleted since last visit.
  loadDataFromStorage();

  // Today's date, shown top-right.
  const dateEl = document.getElementById("today-date");
  const today = new Date();
  dateEl.textContent = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Total pending across all systems.
  let totalPending = 0;
  SYSTEM_ORDER.forEach((key) => {
    totalPending += countPending(SYSTEMS[key].items);
  });
  document.getElementById("total-pending").textContent = totalPending;

  // System cards.
  const grid = document.getElementById("system-grid");
  grid.innerHTML = "";

  SYSTEM_ORDER.forEach((key) => {
    const sys = SYSTEMS[key];
    const pending = countPending(sys.items);
    const status = worstStatus(sys.items);
    const color = STATUS_COLOR[status];
    const doneFraction = sys.totalTasks
      ? sys.doneToday / sys.totalTasks
      : 0;

    const card = document.createElement("div");
    card.className = "system-card";
    card.addEventListener("click", (e) => {
      if (e.target.closest(".icon-btn")) return; // edit/delete handled separately
      window.location.href = `detail.html?system=${key}`;
    });

    card.innerHTML = `
      <div class="card-icons edit-only">
        <button type="button" class="icon-btn edit-system-btn" data-key="${key}" title="Edit system">✎</button>
        <button type="button" class="icon-btn danger delete-system-btn" data-key="${key}" title="Delete system">🗑</button>
      </div>
      <div class="head">
        <span class="dot" style="background:${color}"></span>
        <span class="name">${sys.name}</span>
      </div>
      <div class="sub">${sys.sub}</div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${Math.round(
          doneFraction * 100
        )}%; background:${color}"></div>
      </div>
      <div class="row-bottom">
        <span class="status-text ${pending === 0 ? "clear" : ""}" style="color:${
      pending === 0 ? "" : color
    }">
          ${pending === 0 ? "All clear" : `${pending} pending`}
        </span>
        <span class="done-count">${sys.doneToday} / ${sys.totalTasks} done</span>
      </div>
    `;

    grid.appendChild(card);
  });
}

/**
 * Add / Edit / Delete system (admin only)
 * ------------------------------------------------------------------
 */
function openSystemModal(key) {
  const backdrop = document.getElementById("system-modal-backdrop");
  const title = document.getElementById("system-modal-title");
  const keyField = document.getElementById("sf-key");
  const nameField = document.getElementById("sf-name");
  const subField = document.getElementById("sf-sub");
  const totalField = document.getElementById("sf-total");
  const doneField = document.getElementById("sf-done");

  if (key && SYSTEMS[key]) {
    const s = SYSTEMS[key];
    title.textContent = "Edit System";
    keyField.value = key;
    nameField.value = s.name;
    subField.value = s.sub;
    totalField.value = s.totalTasks;
    doneField.value = s.doneToday;
  } else {
    title.textContent = "Add System";
    keyField.value = "";
    nameField.value = "";
    subField.value = "";
    totalField.value = 1;
    doneField.value = 0;
  }

  backdrop.classList.remove("hidden");
  nameField.focus();
}

function closeSystemModal() {
  document.getElementById("system-modal-backdrop").classList.add("hidden");
}

function setupSystemManagement() {
  const addBtn = document.getElementById("add-system-btn");
  const cancelBtn = document.getElementById("system-modal-cancel");
  const backdrop = document.getElementById("system-modal-backdrop");
  const form = document.getElementById("system-form");
  const grid = document.getElementById("system-grid");

  if (!addBtn || !form) return;

  addBtn.addEventListener("click", () => openSystemModal(null));
  cancelBtn.addEventListener("click", closeSystemModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeSystemModal();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!isAdmin()) return;

    const existingKey = document.getElementById("sf-key").value;
    const name = document.getElementById("sf-name").value.trim();
    if (!name) return;
    const sub = document.getElementById("sf-sub").value.trim();
    const totalTasks = Math.max(
      0,
      parseInt(document.getElementById("sf-total").value, 10) || 0
    );
    const doneToday = Math.min(
      totalTasks,
      Math.max(0, parseInt(document.getElementById("sf-done").value, 10) || 0)
    );

    if (existingKey && SYSTEMS[existingKey]) {
      // Editing: keep the same key and items, update the rest.
      Object.assign(SYSTEMS[existingKey], { name, sub, totalTasks, doneToday });
    } else {
      // Adding: generate a unique key and append to the end of the order.
      const newKey = slugifySystemKey(name);
      SYSTEMS[newKey] = { name, sub, totalTasks, doneToday, items: [] };
      SYSTEM_ORDER.push(newKey);
    }

    saveDataToStorage();
    closeSystemModal();
    renderDashboard();
  });

  // Edit / delete icons live inside each card and are re-created on
  // every render, so use one delegated listener on the grid.
  grid.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-system-btn");
    const deleteBtn = e.target.closest(".delete-system-btn");

    if (editBtn) {
      e.stopPropagation();
      openSystemModal(editBtn.dataset.key);
      return;
    }

    if (deleteBtn) {
      e.stopPropagation();
      if (!isAdmin()) return;
      const key = deleteBtn.dataset.key;
      const sys = SYSTEMS[key];
      if (!sys) return;
      const pendingCount = sys.items.length;
      const warn =
        pendingCount > 0
          ? `Delete "${sys.name}"? This also permanently deletes its ${pendingCount} pending item(s).`
          : `Delete "${sys.name}"?`;
      if (!window.confirm(warn)) return;

      delete SYSTEMS[key];
      const idx = SYSTEM_ORDER.indexOf(key);
      if (idx !== -1) SYSTEM_ORDER.splice(idx, 1);

      saveDataToStorage();
      renderDashboard();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderSessionBar();
  renderDashboard();
  setupSystemManagement();
  initCommentWidget();
});
