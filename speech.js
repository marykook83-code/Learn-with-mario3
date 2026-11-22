import { auth } from "./firebase.js";
import { API_BASE_URL } from "./config.js";
import { settings, updateSetting } from "./accessibility.js";
import { $, toast, hasArabic, icon } from "./ui.js";

const EMOJI_PATTERN = /[\u{1F300}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\uFE0F]/gu;
const audioCache = new Map();
let playback = null;

function cleanForSpeech(text) {
  return text
    .replace(/_{2,}/g, " blank ")
    .replace(EMOJI_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectTextNodes(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      !node.nodeValue.trim() || node.parentElement.closest(".speak-btn")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function wrapWords(nodes) {
  const words = [];
  const groups = [];
  let offset = 0;
  nodes.forEach((node) => {
    const text = node.nodeValue;
    const group = document.createElement("span");
    group.className = "rh-group";
    const pattern = /\S+/g;
    let last = 0;
    let match;
    while ((match = pattern.exec(text))) {
      group.append(text.slice(last, match.index));
      const span = document.createElement("span");
      span.className = "rh-word";
      span.textContent = match[0];
      group.append(span);
      words.push({ span, start: offset + match.index, length: match[0].length });
      last = match.index + match[0].length;
    }
    group.append(text.slice(last));
    node.replaceWith(group);
    groups.push({ group, node });
    offset += text.length + 1;
  });
  return { words, groups };
}

function unwrapWords(highlight) {
  highlight?.groups.forEach(({ group, node }) => group.replaceWith(node));
}

function setActiveWord(state, index) {
  if (!state.highlight || state.activeIndex === index) return;
  state.highlight.words[state.activeIndex]?.span.classList.remove("rh-active");
  state.highlight.words[index]?.span.classList.add("rh-active");
  state.activeIndex = index;
}

function setButtonState(button, mode) {
  if (!button) return;
  button.classList.toggle("is-loading", mode === "loading");
  button.classList.toggle("is-playing", mode === "playing");
  button.setAttribute("aria-pressed", String(mode === "playing"));
}

function renderPlayer() {
  const bar = $("#player");
  if (!bar) return;
  bar.hidden = !playback;
  if (!playback) return;
  $("#player-toggle").innerHTML = playback.paused ? icon("play", 18) : icon("pause", 18);
  $("#player-toggle").setAttribute("aria-label", playback.paused ? "Resume" : "Pause");
  $("#player-status").textContent = playback.loading ? "Preparing audio…" : playback.paused ? "Paused" : "Playing";
  $("#player-speed").value = String(settings.speed);
}

async function fetchAudio(text, voice) {
  const key = `${voice}|${text}`;
  if (audioCache.has(key)) return audioCache.get(key);
  const token = await auth.currentUser.getIdToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text, voice }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`TTS request failed (${response.status})`);
    const url = URL.createObjectURL(await response.blob());
    audioCache.set(key, url);
    return url;
  } finally {
    clearTimeout(timer);
  }
}

function startHighlightLoop(state) {
  if (!state.highlight) return;
  const { words } = state.highlight;
  const total = words.reduce((sum, w) => sum + w.length + 1, 0);
  const tick = () => {
    if (playback !== state || !state.audio) return;
    const duration = state.audio.duration;
    if (duration && !state.audio.paused) {
      const target = (state.audio.currentTime / duration) * total;
      let accumulated = 0;
      let index = words.length - 1;
      for (let i = 0; i < words.length; i += 1) {
        accumulated += words[i].length + 1;
        if (target < accumulated) { index = i; break; }
      }
      setActiveWord(state, index);
    }
    state.frame = requestAnimationFrame(tick);
  };
  tick();
}

function playAudio(state, url) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.playbackRate = settings.speed;
    state.audio = audio;
    state.mode = "audio";
    audio.onended = () => stopSpeech();
    audio.onerror = () => reject(new Error("Audio playback failed"));
    audio.play().then(() => {
      state.loading = false;
      setButtonState(state.button, "playing");
      renderPlayer();
      startHighlightLoop(state);
      resolve();
    }).catch(reject);
  });
}

function splitByLanguage(text) {
  const segments = [];
  const pattern = /\S+/g;
  let match;
  while ((match = pattern.exec(text))) {
    const word = match[0];
    const last = segments[segments.length - 1];
    const lang = hasArabic(word) ? "ar" : /[A-Za-z]/.test(word) ? "en" : last?.lang || "ar";
    if (last && last.lang === lang) last.end = match.index + word.length;
    else segments.push({ lang, start: match.index, end: match.index + word.length });
  }
  return segments.map((segment) => ({ ...segment, text: text.slice(segment.start, segment.end) }));
}

function findVoice(lang) {
  const voices = speechSynthesis.getVoices();
  const normalized = (voice) => voice.lang.replace("_", "-").toLowerCase();
  const prefixes = lang === "ar-EG" ? ["ar-eg", "ar"] : ["en-us", "en-gb", "en"];
  for (const prefix of prefixes) {
    const found = voices.find((voice) => normalized(voice) === prefix) || voices.find((voice) => normalized(voice).startsWith(prefix));
    if (found) return found;
  }
  return null;
}

function highlightAtChar(state, charIndex) {
  if (!state.highlight) return;
  const words = state.highlight.words;
  let index = 0;
  for (let i = 0; i < words.length; i += 1) {
    if (words[i].start <= charIndex) index = i;
  }
  setActiveWord(state, index);
}

function startEstimatedHighlight(state) {
  if (!state.highlight) return;
  const words = state.highlight.words;
  const msPerWord = 420 / settings.speed;
  let previous = performance.now();
  let elapsed = 0;
  const tick = (now) => {
    if (playback !== state) return;
    if (!state.paused) elapsed += now - previous;
    previous = now;
    if (!state.gotBoundary && elapsed > 1500) {
      setActiveWord(state, Math.min(words.length - 1, Math.floor(elapsed / msPerWord)));
    }
    state.frame = requestAnimationFrame(tick);
  };
  state.frame = requestAnimationFrame(tick);
}

function playWithBrowserVoice(state, fullText) {
  if (!("speechSynthesis" in window)) {
    toast("Speech is not supported on this device.", "error");
    stopSpeech();
    return;
  }
  const text = fullText.replace(EMOJI_PATTERN, (match) => " ".repeat(match.length));
  const segments = splitByLanguage(text);
  state.mode = "browser";
  state.loading = false;
  state.gotBoundary = false;
  setButtonState(state.button, "playing");
  renderPlayer();
  segments.forEach((segment, index) => {
    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.lang = segment.lang === "ar" ? "ar-EG" : "en-US";
    utterance.rate = settings.speed;
    utterance.pitch = state.voice === "mario" ? 1.25 : 1.05;
    const voice = findVoice(utterance.lang);
    if (voice) utterance.voice = voice;
    utterance.onboundary = (event) => {
      if (event.name && event.name !== "word") return;
      state.gotBoundary = true;
      highlightAtChar(state, segment.start + event.charIndex);
    };
    utterance.onend = () => { if (playback === state && index === segments.length - 1) stopSpeech(); };
    utterance.onerror = (event) => {
      if (playback === state && !["canceled", "interrupted"].includes(event.error)) stopSpeech();
    };
    speechSynthesis.speak(utterance);
  });
  startEstimatedHighlight(state);
}

export function stopSpeech() {
  if (!playback) return;
  const state = playback;
  playback = null;
  state.cancelled = true;
  cancelAnimationFrame(state.frame);
  if (state.audio) {
    state.audio.onended = null;
    state.audio.onerror = null;
    state.audio.pause();
  }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  state.highlight?.words[state.activeIndex]?.span.classList.remove("rh-active");
  unwrapWords(state.highlight);
  setButtonState(state.button, "idle");
  renderPlayer();
}

export function pauseOrResume() {
  if (!playback || playback.loading) return;
  if (playback.paused) {
    if (playback.mode === "audio") playback.audio.play();
    else speechSynthesis.resume();
  } else if (playback.mode === "audio") {
    playback.audio.pause();
  } else {
    speechSynthesis.pause();
  }
  playback.paused = !playback.paused;
  renderPlayer();
}

export async function toggleSpeak(container, button) {
  if (playback?.container === container) {
    stopSpeech();
    return;
  }
  stopSpeech();
  const nodes = collectTextNodes(container);
  if (!nodes.length) return;
  const fullText = nodes.map((node) => node.nodeValue).join(" ");
  const state = {
    container,
    button,
    voice: container.dataset.voice || "mario",
    paused: false,
    loading: true,
    mode: null,
    audio: null,
    cancelled: false,
    activeIndex: -1,
    highlight: settings.readingHelp ? wrapWords(nodes) : null
  };
  playback = state;
  setButtonState(button, "loading");
  renderPlayer();
  try {
    if (!API_BASE_URL || settings.browserVoiceOnly || !auth.currentUser) throw new Error("browser");
    const url = await fetchAudio(cleanForSpeech(fullText), state.voice);
    if (state.cancelled) return;
    await playAudio(state, url);
  } catch (error) {
    if (state.cancelled) return;
    if (error.name === "NotAllowedError") { stopSpeech(); return; }
    if (error.message !== "browser") {
      toast("Mario's voice is unavailable right now, so the browser voice is being used.", "warn");
    }
    playWithBrowserVoice(state, fullText);
  }
}

export function speakIfAutoRead(container) {
  if (settings.autoRead && container && !settings.browserVoiceOnly) {
    toggleSpeak(container, container.querySelector(".speak-btn"));
  }
}

export function initSpeech() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".speak-btn");
    if (!button) return;
    const container = button.closest("[data-speakable]");
    if (container) toggleSpeak(container, button);
  });
  $("#player-toggle").addEventListener("click", pauseOrResume);
  $("#player-stop").addEventListener("click", stopSpeech);
  $("#player-speed").addEventListener("change", (event) => updateSetting("speed", Number(event.target.value)));
  document.addEventListener("settingschange", () => {
    if (playback?.audio) playback.audio.playbackRate = settings.speed;
    renderPlayer();
  });
  if ("speechSynthesis" in window) speechSynthesis.getVoices();
  window.addEventListener("pagehide", stopSpeech);
}
