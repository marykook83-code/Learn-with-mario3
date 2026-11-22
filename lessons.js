import { getChapter, chapterLabel } from "../data/lessons.js";
import { buildSteps } from "./steps.js";
import { saveLessonPosition } from "./progress.js";
import { esc, hasArabic, marioImage, avatarHtml, speakButton, breadcrumb, toast } from "./ui.js";
import { speakIfAutoRead } from "./speech.js";

const CALLOUT_START = /^(حيلة|تحذير|تنبيه|⚠️|📌|غلطة شائعة)/;
const LETTERS = ["A", "B", "C", "D"];

function lineHtml(line) {
  const rtl = hasArabic(line);
  return `<div class="line${rtl ? "" : " line-en"}" dir="${rtl ? "rtl" : "ltr"}">${esc(line)}</div>`;
}

export function richText(text) {
  return text.split(/\n{2,}/).map((block) => {
    const lines = block.split("\n");
    const body = lines.map(lineHtml).join("");
    const first = lines[0].trim();
    if (!CALLOUT_START.test(first)) return `<div class="block">${body}</div>`;
    const kind = first.startsWith("📌") ? "note" : first.startsWith("حيلة") ? "tip" : "warn";
    return `<div class="callout callout-${kind}">${body}</div>`;
  }).join("");
}

function messageHtml(item, profile) {
  if (item.who === "mario") {
    return `
    <article class="msg msg-mario" data-speakable data-voice="mario">
      <div class="msg-avatar mario-avatar">${marioImage("thinking")}</div>
      <div class="msg-body"><header><strong>Mario</strong>${speakButton("Listen to Mario")}</header>${richText(item.text)}</div>
    </article>`;
  }
  return `
    <article class="msg msg-student" data-speakable data-voice="student">
      <div class="msg-body"><header><strong>${esc(profile.nickname)}</strong>${speakButton("Listen to this message")}</header>${richText(item.text)}</div>
      <div class="msg-avatar">${avatarHtml(profile)}</div>
    </article>`;
}

function questionHtml(question, index) {
  const options = question.options.map((option, i) => `
    <button type="button" class="option" data-option="${i}">
      <span class="option-letter">${LETTERS[i]}</span><span class="option-text" dir="ltr">${esc(option)}</span>
    </button>`).join("");
  return `
  <section class="question" data-question="${index}">
    <span class="chip">Practice question</span>
    <div class="q-body" data-speakable data-voice="mario">
      <div class="q-speak">${speakButton("Listen to the question")}</div>
      ${question.ask ? richText(question.ask) : ""}
      ${question.stem ? `<div class="q-stem" dir="ltr">${esc(question.stem)}</div>` : ""}
      <div class="options" role="group" aria-label="Answer choices">${options}</div>
    </div>
    <div class="q-feedback" aria-live="polite"></div>
  </section>`;
}

function feedbackHtml(question, chosen) {
  const right = chosen === question.answer;
  return `
  <div class="feedback ${right ? "feedback-right" : "feedback-wrong"}">
    <div class="feedback-mario">${marioImage(right ? "happy" : "angry")}</div>
    <div class="feedback-text" data-speakable data-voice="mario">
      <header><strong>${right ? "Correct!" : `Not quite. The answer is ${LETTERS[question.answer]}. Let's see why.`}</strong>${speakButton("Listen to the explanation")}</header>
      ${richText(question.explain)}
    </div>
  </div>`;
}

export function renderLesson(root, ctx, chapterId) {
  const chapter = getChapter(chapterId);
  if (!chapter) {
    root.innerHTML = `<div class="notice notice-error">This chapter does not exist. <a href="#/home">Back to Home</a></div>`;
    return;
  }
  const { user, profile } = ctx;
  const steps = buildSteps(chapter);
  const questions = [];
  const saved = Math.min(profile.lessonSteps?.[chapterId] || 0, steps.length);
  let revealed = Math.max(saved, 1);
  let saveWarned = false;
  const smooth = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  root.innerHTML = `
    ${breadcrumb([{ label: "Home", href: "#/home" }, { label: chapterLabel(chapter).split(" · ")[0], href: "#/home" }, { label: chapterLabel(chapter).split(" · ")[1] }])}
    <header class="lesson-head">
      <div>
        <h1>${esc(chapter.title)}</h1>
        <p class="muted" lang="ar" dir="rtl">${esc(chapter.arabicTitle)}</p>
      </div>
      <div class="lesson-progress" role="img" aria-label="Lesson progress"><span class="meter"><span data-meter></span></span><small data-count></small></div>
    </header>
    <div class="thread" data-thread></div>
    <div class="lesson-footer" data-footer></div>`;

  const thread = root.querySelector("[data-thread]");
  const footer = root.querySelector("[data-footer]");
  const meter = root.querySelector("[data-meter]");
  const count = root.querySelector("[data-count]");

  const persist = () => {
    saveLessonPosition(user.uid, profile, chapterId, revealed).catch(() => {
      if (!saveWarned) { toast("Your place in the lesson could not be saved. Check your connection.", "warn"); saveWarned = true; }
    });
  };

  const hasPendingQuestion = () => {
    const last = thread.lastElementChild?.querySelector(".question");
    return Boolean(last && !last.dataset.done);
  };

  const updateFooter = () => {
    meter.style.width = `${Math.round((revealed / steps.length) * 100)}%`;
    count.textContent = `Step ${revealed} of ${steps.length}`;
    if (hasPendingQuestion()) {
      footer.innerHTML = `<button class="btn btn-primary" type="button" disabled>Continue</button><p class="muted">Pick an answer to continue.</p>`;
    } else if (revealed < steps.length) {
      footer.innerHTML = `<button class="btn btn-primary" type="button" data-next>Continue</button>`;
    } else {
      footer.innerHTML = `
        <div class="finish">
          <h2>You reached the end of the lesson</h2>
          <p>Ready to test what you learned? The quiz has 10 questions and you can retake it any time.</p>
          <div class="actions">
            <a class="btn btn-primary" href="#/quiz/${chapterId}">Start the Quiz</a>
            <button class="btn btn-secondary" type="button" data-restart>Read the lesson again</button>
          </div>
        </div>`;
    }
  };

  const bindQuestion = (section, question) => {
    section.querySelectorAll("[data-option]").forEach((button) => {
      button.addEventListener("click", () => {
        if (section.dataset.done) return;
        section.dataset.done = "1";
        const chosen = Number(button.dataset.option);
        section.querySelectorAll("[data-option]").forEach((option, i) => {
          option.disabled = true;
          option.classList.toggle("is-correct", i === question.answer);
          option.classList.toggle("is-wrong", i === chosen && chosen !== question.answer);
        });
        section.querySelector(".q-feedback").innerHTML = feedbackHtml(question, chosen);
        updateFooter();
        section.querySelector(".q-feedback").scrollIntoView({ behavior: smooth, block: "nearest" });
      });
    });
  };

  const appendStep = (index) => {
    const step = steps[index];
    const wrapper = document.createElement("div");
    wrapper.className = "step";
    const parts = [];
    if (step.sceneStart) parts.push(`<h2 class="scene-title" lang="ar" dir="rtl">${esc(chapter.scenes[step.sceneIndex].title)}</h2>`);
    step.items.forEach((item) => {
      if (item.question) {
        questions.push(item.question);
        parts.push(questionHtml(item.question, questions.length - 1));
      } else {
        parts.push(messageHtml(item, profile));
      }
    });
    wrapper.innerHTML = parts.join("");
    thread.append(wrapper);
    wrapper.querySelectorAll(".question").forEach((section) => bindQuestion(section, questions[Number(section.dataset.question)]));
    return wrapper;
  };

  for (let i = 0; i < revealed; i += 1) appendStep(i);
  updateFooter();
  if (saved > 0) thread.lastElementChild.scrollIntoView({ block: "start" });

  footer.addEventListener("click", (event) => {
    if (event.target.closest("[data-next]")) {
      if (hasPendingQuestion() || revealed >= steps.length) return;
      revealed += 1;
      const wrapper = appendStep(revealed - 1);
      wrapper.classList.add("step-new");
      updateFooter();
      persist();
      wrapper.scrollIntoView({ behavior: smooth, block: "start" });
      speakIfAutoRead(wrapper.querySelector(".msg-mario"));
    }
    if (event.target.closest("[data-restart]")) {
      revealed = 1;
      saveLessonPosition(user.uid, profile, chapterId, 1).finally(() => renderLesson(root, ctx, chapterId));
      window.scrollTo({ top: 0 });
    }
  });

  if (revealed === steps.length && saved !== steps.length) persist();
  if (saved === 0) persist();
}
