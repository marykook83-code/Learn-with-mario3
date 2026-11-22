import { auth, onAuthStateChanged } from "./firebase.js";
import { units, chapters, getChapter, chapterLabel } from "../data/lessons.js";
import { loadProfile, saveProfile, chapterStatus, renderProgress } from "./progress.js";
import { buildSteps } from "./steps.js";
import { renderAuth } from "./auth.js";
import { renderSetup, renderAccount } from "./profile.js";
import { renderLesson } from "./lessons.js";
import { renderQuiz, renderHistory, renderAttemptDetail, renderPractice } from "./quizzes.js";
import { initSpeech, stopSpeech } from "./speech.js";
import { applySettings, mergeRemoteSettings, setPersistHook, openSettingsDialog } from "./accessibility.js";
import { $, $$, esc, icon, marioImage, speakButton, avatarHtml, loadingHtml } from "./ui.js";

const state = { user: null, profile: null, ready: false, loadFailed: false };
const root = $("#app");

const WELCOME_MESSAGE =
  "أهلًا بيكم! أنا ماريو، وهكون معاكم في رحلة تعلّم الجرامر الإنجليزي للثانوية العامة. هنفهم كل قاعدة بشرح بسيط، ونتكلم مع بعض في محادثة، ونحل أسئلة تدريب، ونعمل كويز في آخر كل شابتر، وكمان هنتابع مستواكم وتقدمكم خطوة بخطوة. يلا نبدأ؟";

const needsSetup = () => Boolean(state.user) && !state.profile?.nickname;

function renderHeader() {
  const nav = $("#main-nav");
  const chip = $("#account-chip");
  if (state.user) {
    const links = [
      ["#/home", "Home"], ["#/progress", "Progress"], ["#/history", "Quiz History"],
      ["#/practice", "Test Yourself"], ["#/account", "My Account"], ["#/about", "About"]
    ];
    nav.innerHTML = links.map(([href, label]) => `<a href="${href}">${label}</a>`).join("");
    chip.innerHTML = state.profile?.nickname
      ? `<a class="account-chip" href="#/account" aria-label="My Account">${avatarHtml(state.profile, "avatar-sm")}<span>${esc(state.profile.nickname)}</span></a>`
      : "";
    $(".brand").setAttribute("href", "#/home");
  } else {
    nav.innerHTML = `<a href="#/about">About</a><a href="#/auth">Log in</a>`;
    chip.innerHTML = "";
    $(".brand").setAttribute("href", "#/welcome");
  }
  markCurrentLink();
}

function markCurrentLink() {
  const current = location.hash.split("/").slice(0, 2).join("/");
  $$("#main-nav a").forEach((link) => {
    const active = link.getAttribute("href") === current;
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function welcomeView() {
  root.innerHTML = `
    <section class="welcome">
      <div class="welcome-copy">
        <h1>English grammar, explained by Mario</h1>
        <div class="speech-bubble" data-speakable data-voice="mario">
          <header>${speakButton("Listen to Mario")}</header>
          <p lang="ar" dir="rtl">${WELCOME_MESSAGE}</p>
        </div>
        <ul class="feature-list">
          <li>Simple explanations</li><li>Interactive conversations</li><li>Practice questions</li>
          <li>Chapter quizzes</li><li>Personal progress tracking</li>
        </ul>
        <div class="actions">
          <a class="btn btn-primary btn-lg" href="#/auth/register">Get Started</a>
          <a class="btn btn-ghost" href="#/auth">I already have an account</a>
        </div>
      </div>
      <div class="welcome-art">${marioImage("welcome", "welcome-mario")}</div>
    </section>`;
}

function aboutView() {
  root.innerHTML = `
    <section class="narrow prose">
      ${marioImage("smile", "about-mario")}
      <h1>About</h1>
      <p>This platform helps Egyptian Second Baccalaureate students understand and practice English grammar. Mario, a friendly fox, explains each chapter in a conversation, in everyday Egyptian Arabic.</p>
      <h2>How it works</h2>
      <p>Each chapter has a guided lesson with practice questions, then a 10-question quiz. Your score, your answers and your place in the lesson are saved to your account, so you can pick up where you stopped on any device.</p>
      <p>Questions you miss are collected in Test Yourself, where you can practice them again until they stick.</p>
      <h2>Listening and Reading Help</h2>
      <p>Press the speaker button next to any message to hear it. Turn on Reading Help to highlight each word as it is spoken and to adjust text size, line spacing, contrast and font.</p>
      <p>Pictures you upload are only used for your profile. Mario's pictures are separate and never change.</p>
    </section>`;
}

function continueCardHtml(profile) {
  const position = getChapter(profile.position?.chapterId) || chapters[0];
  const label = chapterLabel(position);
  const total = buildSteps(position).length;
  const step = profile.lessonSteps?.[position.id] || 0;
  const status = chapterStatus(profile, position);
  let heading;
  let detail;
  let actions;
  if (step === 0) {
    heading = "Start learning";
    detail = `${label}: ${position.title}`;
    actions = `<a class="btn btn-primary" href="#/chapter/${position.id}">Start Learning</a>`;
  } else if (status.completed) {
    heading = "Chapter completed";
    detail = `${label}: ${position.title}. Best score ${status.bestScore}/10.`;
    actions = `<a class="btn btn-primary" href="#/quiz/${position.id}">Retake the Quiz</a><a class="btn btn-secondary" href="#/chapter/${position.id}">Review the lesson</a>`;
  } else if (step >= total) {
    heading = "Ready for the quiz";
    detail = `${label}: ${position.title}. You finished the lesson.`;
    actions = `<a class="btn btn-primary" href="#/quiz/${position.id}">Start the Quiz</a><a class="btn btn-secondary" href="#/chapter/${position.id}">Review the lesson</a>`;
  } else {
    heading = "Continue Learning";
    detail = `${label}: ${position.title}. Step ${step} of ${total}.`;
    actions = `<a class="btn btn-primary" href="#/chapter/${position.id}">Continue Learning</a>`;
  }
  return `
    <section class="continue-card">
      <div>
        <h2>${heading}</h2>
        <p>${esc(detail)}</p>
        <div class="actions">${actions}</div>
      </div>
      ${marioImage("smile", "continue-mario")}
    </section>`;
}

function chapterTileHtml(entry) {
  if (!entry.available) {
    return `<div class="chapter-tile is-locked" aria-disabled="true">
      <span class="tile-number">${entry.number}</span>
      <span class="tile-text"><strong>${entry.label}</strong><small>Coming soon</small></span>
      ${icon("lock", 18)}
    </div>`;
  }
  const chapter = getChapter(entry.id);
  const status = chapterStatus(state.profile, chapter);
  const badge = status.completed
    ? `<span class="chip chip-done">${icon("check", 14)} Completed</span>`
    : status.lessonPercent > 0
      ? `<span class="chip">In progress</span>`
      : `<span class="chip">Not started</span>`;
  return `<a class="chapter-tile ${status.completed ? "is-done" : ""}" href="#/chapter/${entry.id}">
    <span class="tile-number">${status.completed ? icon("check", 18) : entry.number}</span>
    <span class="tile-text"><strong>${entry.label}</strong><small>${esc(entry.title)}</small></span>
    ${badge}
  </a>`;
}

function homeView() {
  const unitsHtml = units.map((unit) => `
    <section class="unit" aria-labelledby="${unit.id}-title">
      <h2 id="${unit.id}-title">${unit.title}</h2>
      <div class="trail">${unit.chapters.map(chapterTileHtml).join("")}</div>
    </section>`).join("");
  root.innerHTML = `
    <h1 class="greeting">${avatarHtml(state.profile, "avatar-md")}<span>Hi, ${esc(state.profile.nickname)}</span></h1>
    ${continueCardHtml(state.profile)}
    <h2 class="section-title">Units and Chapters</h2>
    ${unitsHtml}
    <div class="quick-links">
      <a href="#/progress">Progress</a><a href="#/history">Quiz History</a><a href="#/practice">Test Yourself</a><a href="#/account">My Account</a>
    </div>`;
}

const routes = [
  { re: /^#\/welcome$/, access: "guest", view: welcomeView },
  { re: /^#\/auth(?:\/(register))?$/, access: "guest", view: (match) => renderAuth(root, match[1] ? "register" : "login") },
  { re: /^#\/about$/, access: "any", view: aboutView },
  { re: /^#\/setup$/, access: "user", view: () => renderSetup(root, ctx()) },
  { re: /^#\/home$/, access: "user", view: homeView },
  { re: /^#\/chapter\/([\w]+)$/, access: "user", view: (match) => renderLesson(root, ctx(), match[1]) },
  { re: /^#\/quiz\/([\w]+)$/, access: "user", view: (match) => renderQuiz(root, ctx(), match[1]) },
  { re: /^#\/history$/, access: "user", view: () => renderHistory(root, ctx()) },
  { re: /^#\/history\/([\w-]+)$/, access: "user", view: (match) => renderAttemptDetail(root, ctx(), match[1]) },
  { re: /^#\/progress$/, access: "user", view: () => renderProgress(root, ctx()) },
  { re: /^#\/practice$/, access: "user", view: () => renderPractice(root, ctx()) },
  { re: /^#\/account$/, access: "user", view: () => renderAccount(root, ctx()) }
];

const ctx = () => ({ user: state.user, profile: state.profile, refreshHeader: renderHeader });

function route() {
  if (!state.ready) return;
  stopSpeech();
  const hash = location.hash || (state.user ? "#/home" : "#/welcome");
  const target = routes.find((entry) => entry.re.test(hash));

  if (state.user && state.loadFailed) {
    root.innerHTML = `<div class="notice notice-error"><p>Your account data could not be loaded. Check your connection and try again.</p><button class="btn btn-primary" type="button" id="retry-load">Try again</button></div>`;
    $("#retry-load").addEventListener("click", () => location.reload());
    return;
  }
  if (!target) {
    root.innerHTML = `<div class="empty">${marioImage("thinking", "empty-mario")}<h1>Page not found</h1><p>This page does not exist.</p><a class="btn btn-primary" href="${state.user ? "#/home" : "#/welcome"}">Go to the start</a></div>`;
    return;
  }
  if (!state.user && target.access === "user") { location.replace("#/auth"); return; }
  if (state.user && target.access === "guest") { location.replace("#/home"); return; }
  if (needsSetup() && !/^#\/setup$/.test(hash)) { location.replace("#/setup"); return; }
  if (!needsSetup() && /^#\/setup$/.test(hash)) { location.replace("#/home"); return; }

  markCurrentLink();
  const match = hash.match(target.re);
  try {
    target.view(match);
  } catch (error) {
    console.error(error);
    root.innerHTML = `<div class="notice notice-error">Something went wrong while opening this page. <a href="#/home">Back to Home</a></div>`;
  }
  window.scrollTo({ top: 0 });
  root.focus({ preventScroll: true });
}

function start() {
  applySettings();
  initSpeech();
  $("#reading-help-toggle").addEventListener("click", openSettingsDialog);
  $("#settings-close").addEventListener("click", () => $("#settings-dialog").close());
  setPersistHook((settings) => {
    if (state.user) saveProfile(state.user.uid, { settings }).catch(() => {});
  });
  const apiKey = auth.app?.options?.apiKey || "";
  if (!apiKey || apiKey.startsWith("PASTE")) {
    root.innerHTML = `<div class="notice notice-error" style="max-width:720px;margin:2rem auto"><h2>Firebase is not set up yet</h2><p>Open <code>frontend/js/firebase-config.js</code> and replace every <code>PASTE_YOUR_...</code> value with the values from Firebase console > Project settings > Your apps.</p><p>لازم تحطي بيانات Firebase في ملف firebase-config.js.</p></div>`;
    return;
  }
  root.innerHTML = loadingHtml("Loading");
  window.addEventListener("hashchange", route);

  onAuthStateChanged(auth, async (user) => {
    state.user = user;
    state.profile = null;
    state.loadFailed = false;
    if (user) {
      try {
        state.profile = (await loadProfile(user.uid)) || {};
        if (state.profile.settings) mergeRemoteSettings(state.profile.settings);
      } catch (error) {
        console.error(error);
        state.profile = {};
        state.loadFailed = true;
      }
    }
    state.ready = true;
    renderHeader();
    route();
  });
}

start();
