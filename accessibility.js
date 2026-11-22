import { $ } from "./ui.js";

const STORAGE_KEY = "mario_settings";

export const defaultSettings = {
  readingHelp: false,
  fontScale: 100,
  lineHeight: 1.7,
  contrast: "default",
  dyslexiaFont: false,
  speed: 1,
  autoRead: false,
  browserVoiceOnly: false
};

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export const settings = { ...defaultSettings, ...readStored() };

let persistHook = null;
let persistTimer = null;

export function setPersistHook(fn) {
  persistHook = fn;
}

export function applySettings() {
  const root = document.documentElement;
  const on = settings.readingHelp;
  root.style.setProperty("--font-scale", on ? settings.fontScale / 100 : 1);
  root.style.setProperty("--reading-line-height", on ? settings.lineHeight : "");
  root.dataset.readingHelp = on ? "on" : "off";
  root.dataset.contrast = on ? settings.contrast : "default";
  root.dataset.dyslexia = on && settings.dyslexiaFont ? "on" : "off";
  const button = $("#reading-help-toggle");
  if (button) button.setAttribute("aria-pressed", String(on));
}

export function mergeRemoteSettings(remote) {
  if (!remote) return;
  Object.assign(settings, remote);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  applySettings();
  document.dispatchEvent(new CustomEvent("settingschange"));
}

export function updateSetting(key, value) {
  settings[key] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  applySettings();
  document.dispatchEvent(new CustomEvent("settingschange"));
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => persistHook?.({ ...settings }), 600);
}

export function settingsFormHtml() {
  const disabled = settings.readingHelp ? "" : "disabled";
  return `
  <form class="settings-form" onsubmit="return false">
    <fieldset>
      <legend>Reading Help</legend>
      <label class="switch-row">
        <input type="checkbox" data-setting="readingHelp" ${settings.readingHelp ? "checked" : ""}>
        <span>Turn on Reading Help <small>Highlights each word while Mario speaks and unlocks the display options below.</small></span>
      </label>
      <label class="field">
        <span>Text size <output data-out="fontScale">${settings.fontScale}%</output></span>
        <input type="range" min="100" max="150" step="5" value="${settings.fontScale}" data-setting="fontScale" ${disabled}>
      </label>
      <label class="field">
        <span>Line spacing <output data-out="lineHeight">${settings.lineHeight}</output></span>
        <input type="range" min="1.5" max="2.4" step="0.1" value="${settings.lineHeight}" data-setting="lineHeight" ${disabled}>
      </label>
      <label class="field">
        <span>Contrast</span>
        <select data-setting="contrast" ${disabled}>
          ${[["default", "Standard"], ["soft", "Soft paper"], ["high", "High contrast"], ["dark", "Dark"]]
            .map(([value, label]) => `<option value="${value}" ${settings.contrast === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
      <label class="switch-row">
        <input type="checkbox" data-setting="dyslexiaFont" ${settings.dyslexiaFont ? "checked" : ""} ${disabled}>
        <span>Dyslexia-friendly font <small>OpenDyslexic for English text.</small></span>
      </label>
    </fieldset>
    <fieldset>
      <legend>Audio</legend>
      <label class="field">
        <span>Reading speed <output data-out="speed">${settings.speed}x</output></span>
        <select data-setting="speed">
          ${[0.75, 1, 1.25, 1.5].map((v) => `<option value="${v}" ${Number(settings.speed) === v ? "selected" : ""}>${v}x</option>`).join("")}
        </select>
      </label>
      <label class="switch-row">
        <input type="checkbox" data-setting="autoRead" ${settings.autoRead ? "checked" : ""}>
        <span>Read new messages automatically <small>Mario speaks each new message in a lesson.</small></span>
      </label>
      <label class="switch-row">
        <input type="checkbox" data-setting="browserVoiceOnly" ${settings.browserVoiceOnly ? "checked" : ""}>
        <span>Use the browser voice only <small>Skips Google Cloud voices.</small></span>
      </label>
    </fieldset>
  </form>`;
}

export function bindSettingsForm(root) {
  const numeric = new Set(["fontScale", "lineHeight", "speed"]);
  root.querySelectorAll("[data-setting]").forEach((control) => {
    control.addEventListener("input", () => {
      const key = control.dataset.setting;
      let value = control.type === "checkbox" ? control.checked : control.value;
      if (numeric.has(key)) value = Number(value);
      updateSetting(key, value);
      const out = root.querySelector(`[data-out="${key}"]`);
      if (out) out.textContent = key === "fontScale" ? `${value}%` : key === "speed" ? `${value}x` : value;
      if (key === "readingHelp") {
        root.querySelectorAll("[data-setting]").forEach((other) => {
          if (["fontScale", "lineHeight", "contrast", "dyslexiaFont"].includes(other.dataset.setting)) other.disabled = !value;
        });
      }
    });
  });
}

export function openSettingsDialog() {
  const dialog = $("#settings-dialog");
  const body = $("#settings-dialog-body");
  body.innerHTML = settingsFormHtml();
  bindSettingsForm(body);
  if (!dialog.open) dialog.showModal();
}
