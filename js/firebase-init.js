/**
 * firebase-init.js
 * ------------------------------------------------------------------
 * One shared place for your Firebase project's connection details.
 * Both the login page (real sign-in) and the dashboard/detail pages
 * (real-time data sync) need this, so it lives in its own small file
 * that loads first, before auth.js or cloud.js.
 *
 * These are the same six values you already set up for cloud sync —
 * just moved here so the login page can use them too.
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

if (typeof firebase !== "undefined" && !firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}
