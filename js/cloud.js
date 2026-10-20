/**
 * cloud.js
 * ------------------------------------------------------------------
 * OPTIONAL real-time sync, using a free Firebase Firestore database,
 * so every device sees the SAME data instead of each device keeping
 * its own separate localStorage copy.
 *
 * This file does nothing until FIREBASE_CONFIG below is filled in
 * with your own free Firebase project's details — until then, the
 * site works exactly as before (each device on its own). See the
 * setup steps given in chat for how to create that free project and
 * get these six values; it only needs doing once.
 *
 * How it works once configured:
 *   - All the data (same shape as what's saved to localStorage) lives
 *     in one shared Firestore document.
 *   - Every device listens for changes to that document in real time.
 *     When one admin adds, edits or deletes something, every other
 *     device's page updates automatically within a second or two —
 *     no refresh needed.
 *   - localStorage is still used underneath as an offline cache, so
 *     the page still shows the last-known data immediately while the
 *     cloud copy loads, and still works if the internet briefly drops.
 * ------------------------------------------------------------------
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDGyujcfpwQQQW2nlky1K4I1xVBumKFe_0",
  authDomain: "technician-checklist-c68eb.firebaseapp.com",
  projectId: "technician-checklist-c68eb",
  storageBucket: "technician-checklist-c68eb.firebasestorage.app",
  messagingSenderId: "744866633968",
  appId: "1:744866633968:web:778525233639b349b4ca35",
};

const CLOUD_ENABLED = FIREBASE_CONFIG.apiKey !== "PASTE_YOUR_API_KEY_HERE";

let cloudDocRef = null;
// Set right before we write data that only just arrived FROM the cloud,
// so we don't immediately echo it straight back up again.
let suppressNextCloudPush = false;

if (CLOUD_ENABLED && typeof firebase !== "undefined") {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    const db = firebase.firestore();
    cloudDocRef = db.collection("technician-checklist").doc("data");
  } catch (e) {
    console.error("Could not start cloud sync:", e);
  }
}

/**
 * Sends the current SYSTEMS / SYSTEM_ORDER up to the shared cloud
 * document. Called automatically from storage.js's saveDataToStorage,
 * so every existing add/edit/delete action already triggers this —
 * nothing elsewhere in the code needed to change.
 */
function pushSnapshotToCloud() {
  if (!cloudDocRef) return;
  if (suppressNextCloudPush) {
    suppressNextCloudPush = false;
    return;
  }
  cloudDocRef.set(snapshotData()).catch((e) => {
    console.error("Could not sync to cloud:", e);
  });
}

function applyCloudData(data) {
  if (!data || !data.systemOrder || !data.systems) return;
  SYSTEM_ORDER.splice(0, SYSTEM_ORDER.length, ...data.systemOrder);
  Object.keys(SYSTEMS).forEach((k) => delete SYSTEMS[k]);
  Object.keys(data.systems).forEach((k) => {
    SYSTEMS[k] = data.systems[k];
  });
}

/**
 * Call once per page, after the page's own first render. Pass the
 * page's render function (renderDashboard or renderDetail) so this
 * can re-render automatically whenever fresh data arrives — including
 * changes made moments ago on someone else's phone or laptop.
 */
function startCloudSync(onUpdate) {
  if (!cloudDocRef) return; // not configured yet — stays per-device only

  cloudDocRef
    .get()
    .then((doc) => {
      if (doc.exists) {
        applyCloudData(doc.data());
        saveDataToStorage(); // refresh the local offline cache too
        if (onUpdate) onUpdate();
      } else {
        // Nothing in the cloud yet — seed it with whatever this
        // device currently has (e.g. the original sample data).
        pushSnapshotToCloud();
      }

      // Stay subscribed for live updates from any device from now on.
      cloudDocRef.onSnapshot((snap) => {
        if (!snap.exists) return;
        suppressNextCloudPush = true;
        applyCloudData(snap.data());
        saveDataToStorage();
        if (onUpdate) onUpdate();
      });
    })
    .catch((e) => {
      console.error(
        "Could not reach the cloud database — showing this device's last-saved copy instead:",
        e
      );
    });
}
