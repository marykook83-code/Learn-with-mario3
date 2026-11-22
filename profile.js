import { auth, signOut } from "./firebase.js";
import { saveProfile, listAttempts, chapterStatus } from "./progress.js";
import { esc, toast, icon, avatarHtml, breadcrumb, loadingHtml, formatDate, marioImage } from "./ui.js";
import { settingsFormHtml, bindSettingsForm } from "./accessibility.js";
import { chapters, chapterLabel } from "../data/lessons.js";

const MAX_FILE_BYTES = 12 * 1024 * 1024;

async function loadBitmap(file) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to the Image element */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => reject(new Error("This image format is not supported."));
    image.src = url;
  });
}

async function resizeToSquare(file, size = 256) {
  const bitmap = await loadBitmap(file);
  const width = bitmap.width || bitmap.naturalWidth;
  const height = bitmap.height || bitmap.naturalHeight;
  const side = Math.min(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.getContext("2d").drawImage(bitmap, (width - side) / 2, (height - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.8);
}

async function saveStudent(user, profile, nickname, file) {
  const update = { nickname };
  if (file) update.photoURL = await resizeToSquare(file);
  if (!profile.createdMs) update.createdMs = Date.now();
  await saveProfile(user.uid, update);
  Object.assign(profile, update);
}

function profileFormHtml(profile, submitLabel) {
  return `
  <form class="profile-form" novalidate>
    <div class="photo-picker">
      <div class="photo-preview" data-preview>${avatarHtml(profile, "avatar-xl")}</div>
      <div class="photo-actions">
        <label class="btn btn-secondary">${icon("image")} Choose from gallery
          <input class="visually-hidden" type="file" accept="image/*" data-input="gallery"></label>
        <label class="btn btn-secondary">${icon("camera")} Take a photo
          <input class="visually-hidden" type="file" accept="image/*" capture="user" data-input="camera"></label>
        <p class="muted" data-file-note>Your picture is saved to your account and stays after you refresh.</p>
      </div>
    </div>
    <label class="field">
      <span>Nickname</span>
      <input name="nickname" type="text" minlength="2" maxlength="20" autocomplete="nickname" required value="${esc(profile.nickname || "")}">
    </label>
    <p class="form-error" role="alert" hidden></p>
    <button class="btn btn-primary" type="submit">${submitLabel}</button>
  </form>`;
}

function mountProfileForm(root, { user, profile }, onSaved) {
  const form = root.querySelector(".profile-form");
  const preview = form.querySelector("[data-preview]");
  const note = form.querySelector("[data-file-note]");
  const error = form.querySelector(".form-error");
  const submit = form.querySelector("button[type=submit]");
  let chosenFile = null;
  let previewUrl = null;

  form.querySelectorAll("input[type=file]").forEach((input) => {
    input.addEventListener("change", () => {
      const file = input.files[0];
      input.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) { toast("Please choose an image file.", "error"); return; }
      if (file.size > MAX_FILE_BYTES) { toast("That image is too large. Choose one under 12 MB.", "error"); return; }
      chosenFile = file;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(file);
      preview.innerHTML = `<img class="avatar avatar-xl" src="${previewUrl}" alt="Selected profile picture preview">`;
      note.textContent = "New picture selected. Press Save to keep it.";
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nickname = form.nickname.value.trim().replace(/\s+/g, " ");
    error.hidden = true;
    if (nickname.length < 2 || nickname.length > 20) {
      error.textContent = "Your nickname needs 2 to 20 characters.";
      error.hidden = false;
      form.nickname.focus();
      return;
    }
    submit.disabled = true;
    submit.textContent = "Saving…";
    try {
      await saveStudent(user, profile, nickname, chosenFile);
      chosenFile = null;
      toast("Profile saved.", "success");
      onSaved();
    } catch (problem) {
      error.textContent = `Your profile could not be saved. ${problem.message || "Check your connection and try again."}`;
      error.hidden = false;
    } finally {
      submit.disabled = false;
      submit.textContent = "Save";
    }
  });
}

export function renderSetup(root, ctx) {
  root.innerHTML = `
    <section class="narrow setup">
      ${marioImage("smile", "setup-mario")}
      <h1>Set up your profile</h1>
      <p>Pick a nickname and, if you like, a picture. They appear next to your messages in every lesson.</p>
      ${profileFormHtml(ctx.profile, "Save and start")}
    </section>`;
  mountProfileForm(root, ctx, () => { location.hash = "#/home"; });
}

export async function renderAccount(root, ctx) {
  const { user, profile } = ctx;
  root.innerHTML = `
    ${breadcrumb([{ label: "Home", href: "#/home" }, { label: "My Account" }])}
    <h1>My Account</h1>
    <div class="account-grid">
      <section class="panel" aria-labelledby="profile-heading">
        <h2 id="profile-heading">Profile</h2>
        <p class="muted">${esc(user.email || "Signed in with Google")}</p>
        ${profileFormHtml(profile, "Save")}
      </section>
      <section class="panel" aria-labelledby="settings-heading">
        <h2 id="settings-heading">Accessibility and audio</h2>
        <div data-settings>${settingsFormHtml()}</div>
      </section>
    </div>
    <section class="panel" aria-labelledby="learning-heading">
      <h2 id="learning-heading">Learning</h2>
      <div data-learning>${loadingHtml("Loading your results")}</div>
    </section>
    <div class="actions"><button class="btn btn-secondary" data-logout type="button">Log out</button></div>`;

  mountProfileForm(root, ctx, () => ctx.refreshHeader());
  bindSettingsForm(root.querySelector("[data-settings]"));
  root.querySelector("[data-logout]").addEventListener("click", () => signOut(auth).then(() => { location.hash = "#/welcome"; }));

  const target = root.querySelector("[data-learning]");
  try {
    const attempts = await listAttempts(user.uid);
    const quizzes = attempts.filter((item) => item.type === "quiz");
    const practice = attempts.filter((item) => item.type === "practice");
    const average = quizzes.length
      ? Math.round((quizzes.reduce((sum, item) => sum + item.score / item.total, 0) / quizzes.length) * 100)
      : null;
    const done = chapters.filter((chapter) => chapterStatus(profile, chapter).completed);
    const recent = attempts.slice(0, 5).map((item) => {
      const title = item.type === "practice" ? "Test Yourself" : chapterLabel(chapters.find((c) => c.id === item.chapterId) || chapters[0]);
      return `<li><a href="#/history/${item.id}"><span>${esc(title)}</span><span>${formatDate(item.createdMs)}</span><strong>${item.score}/${item.total}</strong></a></li>`;
    }).join("");
    target.innerHTML = `
      <div class="stats">
        <div class="stat"><strong>${done.length}/${chapters.length}</strong><span>Chapters completed</span></div>
        <div class="stat"><strong>${quizzes.length}</strong><span>Quiz attempts</span></div>
        <div class="stat"><strong>${average === null ? "–" : `${average}%`}</strong><span>Average quiz score</span></div>
        <div class="stat"><strong>${practice.length}</strong><span>Practice sessions</span></div>
      </div>
      <h3>Completed chapters</h3>
      ${done.length
        ? `<ul class="plain-list">${done.map((chapter) => `<li><span class="chip chip-done">${icon("check", 14)} ${esc(chapterLabel(chapter))}</span> ${esc(chapter.title)}, best score ${chapterStatus(profile, chapter).bestScore}/10</li>`).join("")}</ul>`
        : `<p class="muted">No chapter is completed yet. Score 7/10 or more on a chapter quiz to complete it.</p>`}
      <h3>Recent attempts</h3>
      ${recent ? `<ul class="attempt-list">${recent}</ul><a class="btn btn-secondary" href="#/history">See all in Quiz History</a>` : `<p class="muted">You have not taken a quiz yet.</p>`}`;
  } catch {
    target.innerHTML = `<div class="notice notice-error">Your results could not be loaded. Refresh the page to try again.</div>`;
  }
}
