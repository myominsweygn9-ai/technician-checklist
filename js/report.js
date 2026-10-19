/**
 * report.js
 * ------------------------------------------------------------------
 * Turns one system's pending items into a downloadable Word file,
 * entirely in the browser — no server needed, works on GitHub Pages.
 *
 * How it works: Word is able to open a file that's actually plain
 * HTML, as long as the file is saved with a .doc extension. So this
 * builds a simple HTML page (title, summary, a table of every pending
 * item) and downloads it as "<System Name>_Report.doc". Double-
 * clicking that file opens it in Microsoft Word like any other
 * document, ready to read, print, or edit further.
 * ------------------------------------------------------------------
 */

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function buildReportHtml(sys, items) {
  const generatedOn = new Date().toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const rows = items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.title)}</td>
          <td>${escapeHtml(item.status)}</td>
          <td>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(item.location)}</td>
          <td>${escapeHtml(item.reported)}</td>
          <td>${escapeHtml(item.ackBy || "Not yet acknowledged")}</td>
          <td>${escapeHtml(item.nextStep)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(sys.name)} — Pending Items Report</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; color: #1a1a1a; }
        h1 { color: #1f3a5f; margin-bottom: 0; }
        .sub { color: #555; margin-top: 4px; }
        .meta { margin: 16px 0; font-size: 13px; color: #555; }
        table { border-collapse: collapse; width: 100%; margin-top: 16px; }
        th, td { border: 1px solid #ccc; padding: 8px; font-size: 13px; text-align: left; vertical-align: top; }
        th { background: #1f3a5f; color: #ffffff; }
        tr:nth-child(even) { background: #f3f5f8; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(sys.name)}</h1>
      <div class="sub">${escapeHtml(sys.sub)}</div>
      <div class="meta">
        Report generated: ${generatedOn}<br/>
        Total pending items: ${items.length}
      </div>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Description</th>
            <th>Location</th>
            <th>Reported</th>
            <th>Acknowledged By</th>
            <th>Next Step</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="7">No pending items — all clear.</td></tr>`}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

/**
 * Downloads the Word-compatible .doc as the given filename. Shared by
 * both the single-system export and the all-systems export below.
 */
function downloadWordDoc(html, filename) {
  // The leading ﻿ (byte-order mark) helps Word detect the text
  // encoding correctly so special characters don't come out garbled.
  const blob = new Blob(["﻿", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportSystemReport(key) {
  const sys = SYSTEMS[key];
  if (!sys) return;

  const html = buildReportHtml(sys, sys.items);
  const safeName = sys.name.replace(/[^a-z0-9]+/gi, "_");
  downloadWordDoc(html, `${safeName}_Report.doc`);
}

/**
 * All-Systems summary report
 * ------------------------------------------------------------------
 * One Word file covering every system: a cover summary table (system,
 * pending count, worst status) followed by each system's own detail
 * table, in the same order they appear on the dashboard.
 * ------------------------------------------------------------------
 */
function buildAllSystemsReportHtml() {
  const generatedOn = new Date().toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let totalPending = 0;
  const summaryRows = SYSTEM_ORDER.map((key) => {
    const sys = SYSTEMS[key];
    const pending = sys.items.length;
    totalPending += pending;
    const worst = pending === 0
      ? "All clear"
      : sys.items.some((i) => i.status === "Overdue")
      ? "Overdue"
      : sys.items.some((i) => i.status === "In Progress")
      ? "In Progress"
      : "Pending";
    return `
      <tr>
        <td>${escapeHtml(sys.name)}</td>
        <td>${pending}</td>
        <td>${escapeHtml(worst)}</td>
      </tr>
    `;
  }).join("");

  const sections = SYSTEM_ORDER.map((key) => {
    const sys = SYSTEMS[key];
    const rows = sys.items
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.title)}</td>
            <td>${escapeHtml(item.status)}</td>
            <td>${escapeHtml(item.description)}</td>
            <td>${escapeHtml(item.location)}</td>
            <td>${escapeHtml(item.reported)}</td>
            <td>${escapeHtml(item.ackBy || "Not yet acknowledged")}</td>
            <td>${escapeHtml(item.nextStep)}</td>
          </tr>
        `
      )
      .join("");

    return `
      <h2>${escapeHtml(sys.name)}</h2>
      <div class="sub">${escapeHtml(sys.sub)}</div>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Description</th>
            <th>Location</th>
            <th>Reported</th>
            <th>Acknowledged By</th>
            <th>Next Step</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="7">No pending items — all clear.</td></tr>`}
        </tbody>
      </table>
    `;
  }).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>All Systems — Pending Items Report</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; color: #1a1a1a; }
        h1 { color: #1f3a5f; margin-bottom: 0; }
        h2 { color: #1f3a5f; margin-top: 32px; border-top: 2px solid #1f3a5f; padding-top: 14px; }
        .sub { color: #555; margin-top: 4px; }
        .meta { margin: 16px 0; font-size: 13px; color: #555; }
        table { border-collapse: collapse; width: 100%; margin-top: 16px; }
        th, td { border: 1px solid #ccc; padding: 8px; font-size: 13px; text-align: left; vertical-align: top; }
        th { background: #1f3a5f; color: #ffffff; }
        tr:nth-child(even) { background: #f3f5f8; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <h1>All Systems — Pending Items Report</h1>
      <div class="meta">
        Report generated: ${generatedOn}<br/>
        Total systems: ${SYSTEM_ORDER.length}<br/>
        Total pending items across all systems: ${totalPending}
      </div>

      <h2 style="margin-top:20px;border-top:none;padding-top:0;">Summary</h2>
      <table>
        <thead>
          <tr><th>System</th><th>Pending Items</th><th>Worst Status</th></tr>
        </thead>
        <tbody>${summaryRows}</tbody>
      </table>

      <div class="page-break"></div>
      ${sections}
    </body>
    </html>
  `;
}

function exportAllSystemsReport() {
  const html = buildAllSystemsReportHtml();
  const dateStamp = new Date().toISOString().slice(0, 10);
  downloadWordDoc(html, `All_Systems_Report_${dateStamp}.doc`);
}
