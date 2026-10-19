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

function exportSystemReport(key) {
  const sys = SYSTEMS[key];
  if (!sys) return;

  const html = buildReportHtml(sys, sys.items);
  // The leading ﻿ (byte-order mark) helps Word detect the text
  // encoding correctly so special characters don't come out garbled.
  const blob = new Blob(["﻿", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);

  const safeName = sys.name.replace(/[^a-z0-9]+/gi, "_");
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}_Report.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
