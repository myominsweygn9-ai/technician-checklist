/**
 * storage.js
 * ------------------------------------------------------------------
 * Saves and loads EVERYTHING that can change at runtime — the list
 * of systems (name, subtitle, task counts, order) and each system's
 * pending items — to the browser's own localStorage. This is what
 * makes added/edited/deleted systems and items still be there after
 * navigating to another page or reloading.
 *
 * IMPORTANT — what this is and isn't:
 *   - This only lives inside ONE browser on ONE device. Data added
 *     on your phone will NOT show up on your laptop, and clearing
 *     browser data/cache will erase it.
 *   - It is not a real database or backend. For that (so every
 *     technician sees the same live data from any device), this
 *     needs a real server — see the notes in chat.
 *   - The first time the page loads with nothing saved yet, it saves
 *     the sample data from data.js as the starting point.
 * ------------------------------------------------------------------
 */

const DATA_KEY = "tc_data_v1";

function snapshotData() {
  const systems = {};
  SYSTEM_ORDER.forEach((key) => {
    const s = SYSTEMS[key];
    systems[key] = {
      name: s.name,
      sub: s.sub,
      totalTasks: s.totalTasks,
      doneToday: s.doneToday,
      items: s.items,
    };
  });
  return { systemOrder: SYSTEM_ORDER.slice(), systems };
}

function saveDataToStorage() {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(snapshotData()));
  } catch (e) {
    console.error("Could not save to browser storage:", e);
  }
}

function loadDataFromStorage() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const data = JSON.parse(raw);

      // SYSTEM_ORDER and SYSTEMS are declared with `const` in data.js,
      // so we mutate them in place rather than reassign — every other
      // file sees the same updated content through the same name.
      SYSTEM_ORDER.splice(0, SYSTEM_ORDER.length, ...data.systemOrder);
      Object.keys(SYSTEMS).forEach((k) => delete SYSTEMS[k]);
      Object.keys(data.systems).forEach((k) => {
        SYSTEMS[k] = data.systems[k];
      });
    }
  } catch (e) {
    console.error("Could not load from browser storage:", e);
  }

  // Every item needs a stable, unique id so it can be found and
  // deleted later. Sample items from data.js don't have one yet.
  SYSTEM_ORDER.forEach((key) => {
    SYSTEMS[key].items.forEach((item, i) => {
      if (!item.id) {
        item.id = `${key}-${Date.now()}-${i}-${Math.random()
          .toString(36)
          .slice(2, 7)}`;
      }
    });
  });

  saveDataToStorage();
}

// Turns a system name into a safe, unique key, e.g.
// "Rooftop Solar" -> "rooftopsolar" (or "rooftopsolar2" if taken).
function slugifySystemKey(name) {
  let base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
  if (!base) base = "system";
  let key = base;
  let n = 2;
  while (SYSTEMS[key]) {
    key = base + n;
    n += 1;
  }
  return key;
}
