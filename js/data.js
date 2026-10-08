/**
 * COMPANY_NAME
 * Shown centered in the header, between the app name and the date/
 * login info, on every page. Change the text below to your own
 * company name — nothing else needs to change.
 */
const COMPANY_NAME = "Your Company Name Pte Ltd";

// Fills in the centered company name in the header. Called on every
// page once the DOM is ready.
function renderCompanyName() {
  const el = document.getElementById("company-name");
  if (el) el.textContent = COMPANY_NAME;
}

/**
 * data.js
 * ------------------------------------------------------------------
 * Single source of truth for every system and its pending items.
 *
 * To add a new system later:
 *   1. Copy the "security" block below as a template.
 *   2. Change the key (e.g. "landscaping") and fill in the fields.
 *   3. Nothing in index.html, detail.html, dashboard.js or detail.js
 *      needs to change — they read this object automatically.
 *
 * Fields per system:
 *   name        - display name shown on dashboard card and detail header
 *   sub         - short subtitle (the components under this system)
 *   totalTasks  - total recurring tasks tracked for this system
 *   doneToday   - how many of those are done today
 *   items       - array of pending/in-progress issues (see shape below)
 *
 * Fields per item:
 *   title       - short issue title
 *   status      - "Overdue" | "In Progress" | "Pending"
 *   description - what happened, plain language
 *   location    - where in the building
 *   reported    - date/time + who reported it
 *   ackBy       - name + date of who acknowledged it, or null if nobody yet
 *   nextStep    - what happens next
 *   photoLabel  - caption for the placeholder photo (swap for a real <img> later)
 * ------------------------------------------------------------------
 */

/**
 * SAMPLE_PHOTO
 * A small built-in placeholder image so every item has something to
 * show in its photo box without needing internet access.
 *
 * TO USE A REAL PHOTO ON A REAL PROJECT:
 *   - Put your photo file in a folder, e.g. "photos/carpark-lpr.jpg"
 *   - On that item, set:  photo: "photos/carpark-lpr.jpg"
 *   - Any item without its own "photo" field falls back to this one.
 */
const SAMPLE_PHOTO =
  "data:image/png;base64,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";

const SYSTEMS = {
  security: {
    image: "images/security.jpg",
    name: "Security Systems",
    sub: "CCTV, Access Control, Alarm Monitoring, Carpark",
    totalTasks: 6,
    doneToday: 3,
    items: [
      {
        title: "Carpark LPR camera not reading plates",
        status: "Overdue",
        description:
          "Camera on entry lane 2 fails to read number plates. Vehicles are being let in manually by the guard.",
        location: "Carpark entry lane 2",
        reported: "26 Sep 2026, 08:40 by Guard Tan",
        ackBy: "Kumar (26 Sep, 09:05)",
        nextStep: "Vendor visit booked for 30 Sep",
        photoLabel: "Photo (sample)",
      },
      {
        title: "CCTV camera 07 blurry at night",
        status: "In Progress",
        description:
          "Image at Block A loading dock is unclear after dark. Possible dirty lens or infrared fault.",
        location: "Block A loading dock",
        reported: "27 Sep 2026, 19:10 by Night guard",
        ackBy: "Ahmad (28 Sep, 08:00)",
        nextStep: "Clean lens and test infrared, today 15:00",
        photoLabel: "Photo (sample)",
      },
      {
        title: "Access reader offline at Dock office door 2",
        status: "Pending",
        description:
          "Card reader shows no light and staff cannot badge in. Door is being opened manually for now.",
        location: "Dock office, door 2",
        reported: "28 Sep 2026, 07:30 by Supervisor Lee",
        ackBy: null,
        nextStep: "Assign to a technician",
        photoLabel: "Photo (sample)",
      },
    ],
  },

  landscaping: {
    image: "images/landscaping.jpg",
    name: "Landscaping",
    sub: "Indoor & Outdoor Plants, Irrigation System",
    totalTasks: 4,
    doneToday: 1,
    items: [],
  },

  lifting: {
    image: "images/lifting.jpg",
    name: "Lifting System",
    sub: "Passenger Lift, Evacuation Lift, Goods Lift",
    totalTasks: 4,
    doneToday: 2,
    items: [],
  },

  aircon: {
    image: "images/aircon.jpg",
    name: "Office Air-Conditioning",
    sub: "FCU, Ceiling Cassette Aircon",
    totalTasks: 6,
    doneToday: 4,
    items: [],
  },

  coldroom: {
    image: "images/coldroom.jpg",
    name: "Cold Room System",
    sub: "Freezer Room, Chiller Room, Temperature Monitoring",
    totalTasks: 4,
    doneToday: 1,
    items: [],
  },

  dehumidifier: {
    image: "images/dehumidifier.jpg",
    name: "Dehumidifier System",
    sub: "Humidity Control, Equipment Maintenance",
    totalTasks: 2,
    doneToday: 2,
    items: [],
  },

  electrical: {
    image: "images/electrical.jpg",
    name: "Electrical System",
    sub: "Transformer, Switchboards, Generator, UPS",
    totalTasks: 5,
    doneToday: 2,
    items: [],
  },

  plumbing: {
    image: "images/plumbing.jpg",
    name: "Plumbing & Sanitary",
    sub: "Water Supply, Drainage Pipe, Toilet",
    totalTasks: 4,
    doneToday: 1,
    items: [],
  },

  fire: {
    image: "images/fire.jpg",
    name: "Fire Protection",
    sub: "Fire Alarm, Sprinklers, Hose Reels, Fire Extinguishers",
    totalTasks: 5,
    doneToday: 1,
    items: [],
  },

  dock: {
    image: "images/dock.jpg",
    name: "Dock Equipment",
    sub: "Dock Levellers, Dock Shelters, Loading Bays",
    totalTasks: 4,
    doneToday: 1,
    items: [],
  },

  reefer: {
    image: "images/reefer.jpg",
    name: "Reefer Plug System",
    sub: "Reefer Power Points Monitoring",
    totalTasks: 3,
    doneToday: 1,
    items: [],
  },

  doors: {
    image: "images/doors.jpg",
    name: "Entry & Exit Doors",
    sub: "Automatic Door, Emergency Door Access Control",
    totalTasks: 2,
    doneToday: 2,
    items: [],
  },

  general: {
    image: "images/general.jpg",
    name: "Building General",
    sub: "Building Fabric, Lighting, Housekeeping, Coordination, Repairs",
    totalTasks: 3,
    doneToday: 1,
    items: [],
  },

  generator: {
    image: "images/generator.jpg",
    name: "Generator Maintenance",
    sub: "Monthly Service and Run Test",
    totalTasks: 1,
    doneToday: 0,
    items: [
      {
        title: "Generator Maintenance (monthly)",
        status: "Pending",
        description:
          "Monthly service: oil, coolant, battery, fuel, belts, on-load test, panel alarms and running hours.",
        location: "Generator room, Block B",
        reported: "Auto-created (monthly task)",
        ackBy: "Kumar (28 Sep, 07:50)",
        nextStep: "Complete maintenance checklist before 30 Sep",
        photoLabel: "Service sticker (sample)",
      },
    ],
  },
};

// The order system cards appear on the dashboard.
const SYSTEM_ORDER = [
  "security",
  "landscaping",
  "lifting",
  "aircon",
  "coldroom",
  "dehumidifier",
  "electrical",
  "plumbing",
  "fire",
  "dock",
  "reefer",
  "doors",
  "general",
  "generator",
];
