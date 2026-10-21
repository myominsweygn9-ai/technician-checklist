/**
 * auth.js
 * ------------------------------------------------------------------
 * Real login, backed by Firebase Authentication — Google's own
 * sign-in system — instead of a plaintext password list sitting in
 * this file. Firebase checks the password itself; it is never
 * stored or visible anywhere in this code.
 *
 * Each signed-in person's ROLE (admin or viewer) is looked up from a
 * "roles" collection in the same Firestore database the checklist
 * data lives in, keyed by that person's unique account ID (UID).
 * That lookup — and whether an action is even allowed — is also
 * enforced by the Firestore security rules themselves, not just by
 * this file. That's the real protection: even someone who edits this
 * JavaScript in their browser cannot grant themselves admin access,
 * because the database checks their role on its own, independently.
 *
 * Needs firebase-init.js, firebase-auth-compat.js and
 * firebase-firestore-compat.js loaded before this file.
 * ------------------------------------------------------------------
 */

let currentUserRole = null; // "admin" | "viewer" | null until known
let currentUserEmail = null;

function isAdmin() {
  return currentUserRole === "admin";
}

function logout() {
  firebase
    .auth()
    .signOut()
    .finally(() => {
      window.location.href = "login.html";
    });
}

/**
 * Call once at the very start of every protected page. Returns a
 * Promise that only resolves once we know who is signed in AND what
 * their role is — pages wait for this before rendering anything, so
 * a signed-out visitor never sees a flash of real data before being
 * sent to the login page.
 */
function requireLogin() {
  return new Promise((resolve) => {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        const next = encodeURIComponent(
          window.location.pathname.split("/").pop() + window.location.search
        );
        window.location.href = `login.html?next=${next}`;
        return; // leaving this page — nothing left to resolve
      }

      currentUserEmail = user.email;

      try {
        const doc = await firebase
          .firestore()
          .collection("roles")
          .doc(user.uid)
          .get();
        currentUserRole = doc.exists ? doc.data().role : "viewer";
      } catch (e) {
        console.error(
          "Could not look up this account's role — treating as Viewer:",
          e
        );
        currentUserRole = "viewer";
      }

      resolve();
    });
  });
}

// Fills in the "Signed in as ..." bar under the header and wires up
// the logout link. Call this AFTER requireLogin() has resolved.
function renderSessionBar() {
  const bar = document.getElementById("session-bar");
  if (!bar || !currentUserEmail) return;

  const label = isAdmin() ? "Admin (edit)" : "Viewer (view only)";

  bar.innerHTML = `Signed in as <strong>${label}</strong> &nbsp;(<span class="session-email">${currentUserEmail}</span>) &nbsp;·&nbsp; <a href="#" id="logout-link">Log out</a>`;
  document.getElementById("logout-link").addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });

  // Hide anything edit-only (Add/Delete buttons, the add-item form)
  // for a Viewer. CSS rule for .view-only lives in style.css. This is
  // just for a tidy screen — the Firestore rules are what actually
  // stop a Viewer's write from working, even if this were bypassed.
  if (!isAdmin()) {
    document.body.classList.add("view-only");
  }
}
