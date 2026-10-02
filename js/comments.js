/**
 * comments.js
 * ------------------------------------------------------------------
 * A simple feedback box. Viewer accounts get a floating "Leave a
 * comment" button in the bottom-right corner on every page — for
 * flagging something wrong or saying what they want changed, without
 * needing edit access. Admin gets a matching bell icon to read (and
 * clear) whatever viewers have sent.
 *
 * Comments are saved the same way everything else in this prototype
 * is: in this browser's localStorage. On one shared device (like a
 * tablet kept at the facility) this works well. If different people
 * use their own phones, each phone's comments stay on that phone —
 * see the storage.js notes for what moving this to a real shared
 * backend later would involve.
 * ------------------------------------------------------------------
 */

const COMMENTS_KEY = "tc_comments_v1";

function loadComments() {
  try {
    return JSON.parse(localStorage.getItem(COMMENTS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveComments(list) {
  try {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Could not save comments:", e);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function currentPageLabel() {
  const params = new URLSearchParams(window.location.search);
  const sysKey = params.get("system");
  if (sysKey && typeof SYSTEMS !== "undefined" && SYSTEMS[sysKey]) {
    return SYSTEMS[sysKey].name;
  }
  return "Dashboard";
}

function buildCommentWidgetShell(extraClass) {
  const wrap = document.createElement("div");
  wrap.className = `comment-widget ${extraClass || ""}`;
  document.body.appendChild(wrap);
  return wrap;
}

function initViewerCommentBox(session) {
  const wrap = buildCommentWidgetShell();
  wrap.innerHTML = `
    <button type="button" id="comment-toggle" class="comment-fab" title="Leave a comment">💬</button>
    <div id="comment-panel" class="comment-panel hidden">
      <div class="comment-panel-head">Leave a comment</div>
      <p class="comment-panel-sub">About: ${escapeHtml(currentPageLabel())}</p>
      <textarea id="comment-text" rows="4" placeholder="Tell the admin what you noticed, or what you'd like changed..."></textarea>
      <div class="comment-panel-actions">
        <button type="button" id="comment-submit" class="btn-primary">Send</button>
        <button type="button" id="comment-close" class="btn-secondary">Close</button>
      </div>
      <p id="comment-sent-msg" class="comment-sent hidden">Thanks — your comment was saved.</p>
    </div>
  `;

  const panel = document.getElementById("comment-panel");
  document.getElementById("comment-toggle").addEventListener("click", () => {
    panel.classList.toggle("hidden");
  });
  document.getElementById("comment-close").addEventListener("click", () => {
    panel.classList.add("hidden");
  });
  document.getElementById("comment-submit").addEventListener("click", () => {
    const textField = document.getElementById("comment-text");
    const text = textField.value.trim();
    if (!text) return;

    const list = loadComments();
    list.unshift({
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      page: currentPageLabel(),
      by: session.label,
      at: new Date().toLocaleString(),
    });
    saveComments(list);

    textField.value = "";
    document.getElementById("comment-sent-msg").classList.remove("hidden");
    setTimeout(() => {
      panel.classList.add("hidden");
      document.getElementById("comment-sent-msg").classList.add("hidden");
    }, 1300);
  });
}

function initAdminCommentsBell() {
  const wrap = buildCommentWidgetShell();

  function badgeHtml(count) {
    return count > 0 ? `<span class="comment-count">${count}</span>` : "";
  }

  wrap.innerHTML = `
    <button type="button" id="comment-toggle" class="comment-fab" title="View comments from viewers">
      💬${badgeHtml(loadComments().length)}
    </button>
    <div id="comment-panel" class="comment-panel admin hidden">
      <div class="comment-panel-head">Comments from viewers</div>
      <div id="comment-list" class="comment-list"></div>
      <div class="comment-panel-actions">
        <button type="button" id="comment-close" class="btn-secondary">Close</button>
      </div>
    </div>
  `;

  const toggleBtn = document.getElementById("comment-toggle");
  const panel = document.getElementById("comment-panel");
  const listBox = document.getElementById("comment-list");

  function renderList() {
    const items = loadComments();
    toggleBtn.innerHTML = `💬${badgeHtml(items.length)}`;

    if (items.length === 0) {
      listBox.innerHTML = `<p class="comment-empty">No comments yet.</p>`;
      return;
    }
    listBox.innerHTML = items
      .map(
        (c) => `
        <div class="comment-item">
          <div class="comment-meta"><strong>${escapeHtml(c.by)}</strong> · ${escapeHtml(
          c.page
        )} · ${escapeHtml(c.at)}</div>
          <div class="comment-text">${escapeHtml(c.text)}</div>
          <button type="button" class="comment-delete" data-id="${c.id}">Clear</button>
        </div>`
      )
      .join("");
  }
  renderList();

  toggleBtn.addEventListener("click", () => panel.classList.toggle("hidden"));
  document.getElementById("comment-close").addEventListener("click", () => {
    panel.classList.add("hidden");
  });
  listBox.addEventListener("click", (e) => {
    const btn = e.target.closest(".comment-delete");
    if (!btn) return;
    saveComments(loadComments().filter((c) => c.id !== btn.dataset.id));
    renderList();
  });
}

function initCommentWidget() {
  const session = getSession();
  if (!session) return;

  if (session.role === "admin") {
    initAdminCommentsBell();
  } else {
    initViewerCommentBox(session);
  }
}
