export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

export const hasArabic = (text) => /[\u0600-\u06FF]/.test(text);

export function formatDate(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function toast(message, type = "info") {
  const host = $("#toasts");
  const item = document.createElement("div");
  item.className = `toast toast-${type}`;
  item.setAttribute("role", type === "error" ? "alert" : "status");
  item.textContent = message;
  host.append(item);
  setTimeout(() => item.remove(), type === "error" ? 6500 : 3800);
}

const iconPaths = {
  speaker: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  cross: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/>',
  camera: '<path d="M4 8h3l2-2h6l2 2h3v11H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/>',
  image: '<rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="1.6"/><path d="M5 17l4.5-4.5 3 3 2-2L19 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  text: '<path d="M5 18l5-12 5 12M7 14h6M17 18l2.5-6 2.5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
};

export function icon(name, size = 20) {
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true" focusable="false">${iconPaths[name]}</svg>`;
}

export function marioImage(mood, className = "") {
  const alt = { welcome: "Mario waving hello", happy: "Mario celebrating", angry: "Mario looking disappointed", thinking: "Mario thinking", smile: "Mario smiling" }[mood];
  return `<img class="mario ${className}" src="assets/mario/mario_${mood}.png" alt="${alt}" width="600" height="410" loading="lazy" decoding="async">`;
}

export function speakButton(label = "Listen") {
  return `<button type="button" class="speak-btn" aria-label="${label}" title="${label}">${icon("speaker", 18)}</button>`;
}

export function avatarHtml(profile, className = "") {
  const name = profile?.nickname || "?";
  if (profile?.photoURL) {
    return `<img class="avatar ${className}" src="${esc(profile.photoURL)}" alt="${esc(name)}" width="96" height="96" loading="lazy">`;
  }
  return `<span class="avatar avatar-initial ${className}" aria-hidden="true">${esc(name.trim().charAt(0).toUpperCase())}</span>`;
}

export function loadingHtml(text = "Loading") {
  return `<div class="loading" role="status"><span class="spinner" aria-hidden="true"></span><span>${esc(text)}…</span></div>`;
}

export function emptyState(title, text, actionHtml = "") {
  return `<div class="empty">${marioImage("smile", "empty-mario")}<h2>${esc(title)}</h2><p>${esc(text)}</p>${actionHtml}</div>`;
}

export function breadcrumb(items) {
  const parts = items.map((item, index) => {
    const last = index === items.length - 1;
    return last
      ? `<span aria-current="page">${esc(item.label)}</span>`
      : `<a href="${item.href}">${esc(item.label)}</a>`;
  });
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${parts.join('<span class="crumb-sep" aria-hidden="true">/</span>')}</nav>`;
}
