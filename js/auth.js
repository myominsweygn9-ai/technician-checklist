/**
 * auth.js
 * ------------------------------------------------------------------
 * A simple two-account login: an Admin account that can add/delete
 * items, and a Viewer account that can only look.
 *
 * BE HONEST WITH YOURSELF ABOUT WHAT THIS IS:
 *   There is no server here — just files running in a browser. The
 *   passwords below are sitting in plain text in this file. Anyone
 *   who opens their browser's developer tools (or just reads this
 *   file) can see them or skip the login entirely. This is enough to
 *   stop a coworker from casually deleting something, or from idly
 *   poking at admin features — it will NOT stop someone who is
 *   comfortable with a browser's dev tools.
 *
 *   For real protection — a login that can't be bypassed even by a
 *   technical person — you need an actual server checking the
 *   password, not a file like this one. Ask me when you're ready to
 *   add that; it's a bigger build.
 *
 * CHANGE THESE before sharing the link with anyone:
 * ------------------------------------------------------------------
 */
const USERS = {
  admin: {
    password: "admin123",
    role: "admin",
    label: "Admin (edit)",
  },
  viewer: {
    password: "viewer123",
    role: "viewer",
    label: "Viewer (view only)",
  },
};

const SESSION_KEY = "tc_session";

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch (e) {
    return null;
  }
}

function isAdmin() {
  const s = getSession();
  return !!s && s.role === "admin";
}

// Redirects to the login page if nobody is signed in. Call this at
// the top of every protected page, before rendering anything.
function requireLogin() {
  const s = getSession();
  if (!s) {
    const next = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    window.location.href = `login.html?next=${next}`;
  }
  return s;
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

// Fills in the "Signed in as ..." bar under the header and wires up
// the logout link. Every protected page has a <div id="session-bar">.
function renderSessionBar() {
  const s = getSession();
  const bar = document.getElementById("session-bar");
  if (!s || !bar) return;

  bar.innerHTML = `Signed in as <strong>${s.label}</strong> &nbsp;·&nbsp; <a href="#" id="logout-link">Log out</a>`;
  document.getElementById("logout-link").addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });

  // Hide anything edit-only (Add/Delete buttons, the add-item form)
  // for a Viewer. CSS rule for .view-only lives in style.css.
  if (s.role !== "admin") {
    document.body.classList.add("view-only");
  }
}
