/**
 * detail.js
 * ------------------------------------------------------------------
 * Renders detail.html for whichever system key is passed in the URL,
 * e.g. detail.html?system=security
 *
 * This one file + template serves every system in data.js — a new
 * system page never needs new HTML, only a new entry in data.js.
 * ------------------------------------------------------------------
 */

const STATUS_BORDER = {
  Overdue: "var(--red)",
  "In Progress": "var(--blue)",
  Pending: "var(--amber)",
};

function chipClass(status) {
  return status.replace(" ", "-"); // "In Progress" -> "In-Progress" to match CSS
}

function renderIssueCard(item) {
  const borderColor = STATUS_BORDER[item.status] || "var(--grey)";
  const ackValue = item.ackBy
    ? `<span class="v">${item.ackBy}</span>`
    : `<span class="v not-acked">Not yet acknowledged</span>`;

  // item.photo can be a real file path (e.g. "photos/x.jpg") set per item
  // in data.js, or a data: URL from the "Add New Item" form's file upload.
  // Falls back to the built-in SAMPLE_PHOTO so every card always shows
  // something — swap in real photos by setting "photo" per item.
  const photoSrc = item.photo || SAMPLE_PHOTO;

  return `
    <div class="issue-card" style="border-left-color:${borderColor}">
      <div class="photo-placeholder">
        <img class="photo-img" src="${photoSrc}" alt="${item.title}" />
      </div>
      <div class="issue-body">
        <div class="top-row">
          <h3>${item.title}</h3>
          <span class="chip ${chipClass(item.status)}">${item.status}</span>
        </div>
        <p class="desc">${item.description}</p>
        <div class="field-grid">
          <div class="field">
            <div class="k">Location</div>
            <div class="v">${item.location}</div>
          </div>
          <div class="field">
            <div class="k">Reported</div>
            <div class="v">${item.reported}</div>
          </div>
          <div class="field">
            <div class="k">Acknowledged By</div>
            ${ackValue}
          </div>
        </div>
        <div class="next-step">
          <span><strong>Next step:</strong> ${item.nextStep}</span>
          <button type="button" class="delete-btn edit-only" data-id="${item.id}">Delete</button>
        </div>
      </div>
    </div>
  `;
}

function renderStatusSummary(items) {
  const counts = { Overdue: 0, "In Progress": 0, Pending: 0 };
  items.forEach((i) => {
    if (counts[i.status] !== undefined) counts[i.status] += 1;
  });

  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(
      ([status, n]) =>
        `<span class="chip ${chipClass(status)}">${n} ${status}</span>`
    )
    .join("");
}

function renderDetail() {
  loadDataFromStorage();

  const params = new URLSearchParams(window.location.search);
  const key = params.get("system");
  const sys = SYSTEMS[key];

  if (!sys) {
    document.getElementById("system-name").textContent = "System not found";
    document.getElementById("system-sub").textContent =
      "Check the link, or go back to the dashboard and click a system card.";
    return;
  }

  document.getElementById("system-name-top").textContent = sys.name;
  document.title = `${sys.name} — Facility Technician Checklist`;
  document.getElementById("system-name").textContent = sys.name;
  document.getElementById("system-sub").textContent = sys.sub;

  const items = sys.items;

  document.getElementById("status-summary").innerHTML =
    renderStatusSummary(items);

  const list = document.getElementById("issue-list");

  if (items.length === 0) {
    list.innerHTML = `
      <p class="section-label">${items.length} PENDING ITEMS</p>
      <div class="empty-state">
        No pending items logged for ${sys.name} yet.<br />
        New issues raised for this system will appear here automatically.
      </div>
    `;
    return;
  }

  list.innerHTML =
    `<p class="section-label">${items.length} PENDING ITEM${
      items.length > 1 ? "S" : ""
    }</p>` + items.map(renderIssueCard).join("");
}

/**
 * Add-item form
 * ------------------------------------------------------------------
 * Adds a new item straight into SYSTEMS[key].items in memory and
 * re-renders the list. This does NOT save to data.js or any file —
 * it resets when the page is refreshed. That's fine for trying the
 * layout; wiring it to real storage is a later step (see chat).
 * ------------------------------------------------------------------
 */

function getCurrentSystemKey() {
  return new URLSearchParams(window.location.search).get("system");
}

function readPhotoFile(fileInput) {
  return new Promise((resolve) => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function setupAddItemForm() {
  const toggleBtn = document.getElementById("toggle-add-form");
  const cancelBtn = document.getElementById("cancel-add-form");
  const form = document.getElementById("add-item-form");
  if (!toggleBtn || !form) return; // system not found — no form to wire up

  toggleBtn.addEventListener("click", () => {
    form.classList.toggle("hidden");
    if (!form.classList.contains("hidden")) {
      document.getElementById("f-title").focus();
    }
  });

  cancelBtn.addEventListener("click", () => {
    form.reset();
    form.classList.add("hidden");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isAdmin()) return;

    const key = getCurrentSystemKey();
    const sys = SYSTEMS[key];
    if (!sys) return;

    const title = document.getElementById("f-title").value.trim();
    if (!title) return;

    const photoDataUrl = await readPhotoFile(document.getElementById("f-photo"));

    const newItem = {
      id: `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      status: document.getElementById("f-status").value,
      description: document.getElementById("f-description").value.trim(),
      location: document.getElementById("f-location").value.trim() || "—",
      reported:
        document.getElementById("f-reported").value.trim() ||
        "Just now",
      ackBy: document.getElementById("f-ackby").value.trim() || null,
      nextStep:
        document.getElementById("f-nextstep").value.trim() ||
        "To be assigned",
      photo: photoDataUrl || null, // falls back to SAMPLE_PHOTO if null
    };

    // Newest item appears first.
    sys.items.unshift(newItem);
    saveDataToStorage();

    form.reset();
    form.classList.add("hidden");
    renderDetail();
  });
}

/**
 * Delete handling
 * ------------------------------------------------------------------
 * Uses one click listener on the whole list (event delegation)
 * instead of one per button, since the list's HTML is replaced
 * every time an item is added or removed.
 * ------------------------------------------------------------------
 */
function setupDeleteHandling() {
  const list = document.getElementById("issue-list");
  if (!list) return;

  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;

    // The button is hidden for Viewer accounts via CSS, but check the
    // role here too in case someone re-enables it through dev tools.
    if (!isAdmin()) return;
    if (!window.confirm("Delete this item? This cannot be undone.")) return;

    const key = getCurrentSystemKey();
    const sys = SYSTEMS[key];
    if (!sys) return;

    sys.items = sys.items.filter((item) => item.id !== btn.dataset.id);
    saveDataToStorage();
    renderDetail();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderSessionBar();
  renderDetail();
  setupAddItemForm();
  setupDeleteHandling();
  initCommentWidget();
});
