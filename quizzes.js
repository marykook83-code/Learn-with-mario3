import { getChapter, chapters, chapterLabel, findQuestion, questionId } from "../data/lessons.js";
import { recordAttempt, listAttempts, getAttempt, listMistakes } from "./progress.js";
import { PASS_SCORE, QUIZ_SIZE } from "./config.js";
import { esc, toast, marioImage, speakButton, breadcrumb, loadingHtml, emptyState, formatDate, icon } from "./ui.js";

const LETTERS = ["A", "B", "C", "D"];

const MESSAGES = {
  good: {
    title: "Great work!",
    text: "برافو! النتيجة حلوة جدًا، وده معناه إن القاعدة اتفهمت كويس. يلا نكمل سوا!"
  },
  low: {
    title: "Keep going, you are close",
    text: "مفيش مشكلة خالص، ده جزء من التعلم. إيه رأيك نراجع الشرح مع بعض ونجرب الكويز تاني؟ أكيد النتيجة هتبقى أحسن."
  }
};

function optionsHtml(question) {
  return question.options.map((option, i) => `
    <button type="button" class="option" data-option="${i}" aria-pressed="false">
      <span class="option-letter">${LETTERS[i]}</span><span class="option-text" dir="ltr">${esc(option)}</span>
    </button>`).join("");
}

function whyHtml(question) {
  return question.options.map((option, i) => `
    <div class="why ${i === question.answer ? "why-correct" : "why-wrong"}">
      <strong dir="ltr">${LETTERS[i]}) ${esc(option)}</strong>
      <span class="why-mark">${i === question.answer ? "Correct" : "Incorrect"}.</span>
      <span class="why-text" dir="rtl" lang="ar">${esc(question.why[i])}</span>
    </div>`).join("");
}

function reviewItemHtml(answer, number) {
  const found = findQuestion(answer.qid);
  if (!found) return "";
  const { question } = found;
  const rows = question.options.map((option, i) => {
    const classes = ["review-option"];
    if (i === question.answer) classes.push("is-correct");
    if (i === answer.selected && !answer.correct) classes.push("is-wrong");
    const tag = i === question.answer ? `${icon("check", 14)}<span class="sr-only">Correct answer</span>` : i === answer.selected ? `${icon("cross", 14)}<span class="sr-only">Your answer</span>` : "";
    return `<li class="${classes.join(" ")}"><span class="option-letter">${LETTERS[i]}</span><span dir="ltr">${esc(option)}</span>${tag}</li>`;
  }).join("");
  return `
  <article class="review-item ${answer.correct ? "ok" : "bad"}">
    <header>
      <h3>Question ${number}</h3>
      <span class="chip ${answer.correct ? "chip-done" : "chip-bad"}">${answer.correct ? "Correct" : "Incorrect"}</span>
    </header>
    <div data-speakable data-voice="mario">
      <div class="q-speak">${speakButton("Listen to the question")}</div>
      <p class="q-stem" dir="ltr">${esc(question.prompt)}</p>
      <ul class="review-options">${rows}</ul>
    </div>
    <div class="explain" data-speakable data-voice="mario">
      <header><strong>Explanation</strong>${speakButton("Listen to the explanation")}</header>
      ${whyHtml(question)}
    </div>
  </article>`;
}

function reviewHtml(answers) {
  const mistakes = answers.filter((answer) => !answer.correct).length;
  return `
  <section class="review" aria-labelledby="review-heading">
    <div class="review-bar">
      <h2 id="review-heading">Review your answers</h2>
      ${mistakes ? `<label class="switch-row"><input type="checkbox" data-mistakes-only><span>Show mistakes only (${mistakes})</span></label>` : `<p class="muted">No mistakes. Every answer was correct.</p>`}
    </div>
    <div class="review-list" data-review-list>${answers.map((answer, i) => reviewItemHtml(answer, i + 1)).join("")}</div>
  </section>`;
}

function bindReview(root) {
  const toggle = root.querySelector("[data-mistakes-only]");
  const list = root.querySelector("[data-review-list]");
  toggle?.addEventListener("change", () => list.classList.toggle("only-mistakes", toggle.checked));
}

function scoreCard({ score, total, good, title, text, extra = "" }) {
  return `
  <section class="result ${good ? "result-good" : "result-low"}">
    <div class="result-mario">${marioImage(good ? "happy" : "angry")}</div>
    <div class="result-body" data-speakable data-voice="mario">
      <p class="result-score"><strong>${score}</strong><span>/ ${total}</span></p>
      <header><h2>${title}</h2>${speakButton("Listen to Mario's message")}</header>
      <p class="result-message" lang="ar" dir="rtl">${text}</p>
      ${extra}
    </div>
  </section>`;
}

export function renderQuiz(root, ctx, chapterId) {
  const chapter = getChapter(chapterId);
  if (!chapter || chapter.quiz.length !== QUIZ_SIZE) {
    root.innerHTML = `<div class="notice notice-error">This quiz does not exist. <a href="#/home">Back to Home</a></div>`;
    return;
  }
  const selections = new Array(QUIZ_SIZE).fill(null);
  let index = 0;

  const crumbs = [{ label: "Home", href: "#/home" }, { label: chapterLabel(chapter), href: `#/chapter/${chapterId}` }, { label: "Quiz" }];

  const draw = () => {
    const question = chapter.quiz[index];
    const last = index === QUIZ_SIZE - 1;
    root.innerHTML = `
      ${breadcrumb(crumbs)}
      <header class="lesson-head">
        <div><h1>Quiz</h1><p class="muted">${esc(chapter.title)}</p></div>
        <div class="lesson-progress"><span class="meter"><span style="width:${((index + 1) / QUIZ_SIZE) * 100}%"></span></span><small>Question ${index + 1} of ${QUIZ_SIZE}</small></div>
      </header>
      <section class="question quiz-question" data-speakable data-voice="mario">
        <div class="q-speak">${speakButton("Listen to the question")}</div>
        <p class="q-stem" dir="ltr">${esc(question.prompt)}</p>
        <div class="options" role="group" aria-label="Answer choices">${optionsHtml(question)}</div>
      </section>
      <div class="quiz-nav">
        <button class="btn btn-secondary" type="button" data-prev ${index === 0 ? "disabled" : ""}>Previous</button>
        <button class="btn btn-primary" type="button" data-next ${selections[index] === null ? "disabled" : ""}>${last ? "Submit answers" : "Next"}</button>
      </div>`;

    const buttons = [...root.querySelectorAll("[data-option]")];
    const next = root.querySelector("[data-next]");
    const mark = () => buttons.forEach((button, i) => {
      const selected = selections[index] === i;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    mark();
    buttons.forEach((button, i) => button.addEventListener("click", () => {
      selections[index] = i;
      mark();
      next.disabled = false;
    }));
    root.querySelector("[data-prev]").addEventListener("click", () => { index -= 1; draw(); });
    next.addEventListener("click", () => {
      if (last) finish();
      else { index += 1; draw(); }
    });
  };

  const finish = async () => {
    const answers = chapter.quiz.map((question, i) => ({
      qid: questionId(chapterId, i),
      selected: selections[i],
      correct: selections[i] === question.answer
    }));
    const score = answers.filter((answer) => answer.correct).length;
    const attempt = { type: "quiz", chapterId, score, total: QUIZ_SIZE, answers };
    root.innerHTML = loadingHtml("Saving your attempt");
    let saved = true;
    try {
      await recordAttempt(ctx.user.uid, ctx.profile, attempt);
    } catch {
      saved = false;
      toast("Your attempt could not be saved. Check your connection.", "error");
    }
    showResult(attempt, saved);
  };

  const showResult = (attempt, saved) => {
    const good = attempt.score >= PASS_SCORE;
    const message = good ? MESSAGES.good : MESSAGES.low;
    root.innerHTML = `
      ${breadcrumb(crumbs)}
      <h1>Quiz result</h1>
      ${saved ? "" : `<div class="notice notice-error">This attempt was not saved to your account.</div>`}
      ${scoreCard({
        score: attempt.score, total: attempt.total, good, title: message.title, text: message.text,
        extra: `<div class="actions">
          <button class="btn btn-primary" type="button" data-retake>Retake the Quiz</button>
          ${good ? `<a class="btn btn-secondary" href="#/home">Back to Home</a>` : `<a class="btn btn-secondary" href="#/chapter/${chapterId}">Review the lesson</a>`}
        </div>`
      })}
      ${reviewHtml(attempt.answers)}`;
    bindReview(root);
    root.querySelector("[data-retake]").addEventListener("click", () => renderQuiz(root, ctx, chapterId));
    window.scrollTo({ top: 0 });
  };

  draw();
}

export async function renderHistory(root, ctx) {
  root.innerHTML = loadingHtml("Loading your attempts");
  let attempts;
  try {
    attempts = await listAttempts(ctx.user.uid);
  } catch {
    root.innerHTML = `<div class="notice notice-error">Your attempts could not be loaded. Refresh the page to try again.</div>`;
    return;
  }
  const rows = attempts.map((item) => {
    const chapter = chapters.find((entry) => entry.id === item.chapterId);
    const title = item.type === "practice" ? "Test Yourself" : `${chapter ? chapterLabel(chapter) : "Quiz"}`;
    const good = item.score / item.total >= PASS_SCORE / QUIZ_SIZE;
    return `<li><a href="#/history/${item.id}">
      <span class="attempt-title">${esc(title)}<small>${item.type === "practice" ? "Practice" : esc(chapter?.title || "")}</small></span>
      <span class="attempt-date">${formatDate(item.createdMs)}</span>
      <span class="chip ${good ? "chip-done" : "chip-bad"}">${item.score}/${item.total}</span>
    </a></li>`;
  }).join("");
  root.innerHTML = `
    ${breadcrumb([{ label: "Home", href: "#/home" }, { label: "Quiz History" }])}
    <h1>Quiz History</h1>
    ${attempts.length
      ? `<ul class="attempt-list attempt-list-large">${rows}</ul>`
      : emptyState("No attempts yet", "Finish a chapter quiz and your scores will be saved here, so you can review every answer later.", `<a class="btn btn-primary" href="#/home">Go to Home</a>`)}`;
}

export async function renderAttemptDetail(root, ctx, attemptId) {
  root.innerHTML = loadingHtml("Loading the attempt");
  let attempt;
  try {
    attempt = await getAttempt(ctx.user.uid, attemptId);
  } catch {
    attempt = null;
  }
  if (!attempt) {
    root.innerHTML = `<div class="notice notice-error">This attempt could not be found. <a href="#/history">Back to Quiz History</a></div>`;
    return;
  }
  const chapter = chapters.find((entry) => entry.id === attempt.chapterId);
  const practice = attempt.type === "practice";
  const good = attempt.score / attempt.total >= PASS_SCORE / QUIZ_SIZE;
  root.innerHTML = `
    ${breadcrumb([{ label: "Home", href: "#/home" }, { label: "Quiz History", href: "#/history" }, { label: formatDate(attempt.createdMs) }])}
    <h1>${practice ? "Test Yourself session" : esc(chapter ? `${chapterLabel(chapter)}: ${chapter.title}` : "Quiz")}</h1>
    <p class="muted">${formatDate(attempt.createdMs)}</p>
    ${scoreCard({
      score: attempt.score, total: attempt.total, good,
      title: good ? MESSAGES.good.title : MESSAGES.low.title,
      text: good ? MESSAGES.good.text : MESSAGES.low.text,
      extra: `<div class="actions">${practice
        ? `<a class="btn btn-primary" href="#/practice">Practice again</a>`
        : `<a class="btn btn-primary" href="#/quiz/${attempt.chapterId}">Retake the Quiz</a>`}</div>`
    })}
    ${reviewHtml(attempt.answers)}`;
  bindReview(root);
}

function pickQuestions(mistakes, wanted) {
  const pool = mistakes.filter((item) => findQuestion(item.qid)).map((item) => ({ ...item }));
  const picked = [];
  while (picked.length < wanted && pool.length) {
    const total = pool.reduce((sum, item) => sum + item.wrongCount, 0);
    let ticket = Math.random() * total;
    let position = 0;
    for (; position < pool.length; position += 1) {
      ticket -= pool[position].wrongCount;
      if (ticket <= 0) break;
    }
    picked.push(pool.splice(Math.min(position, pool.length - 1), 1)[0]);
  }
  return picked;
}

export async function renderPractice(root, ctx) {
  root.innerHTML = loadingHtml("Looking for questions to review");
  let mistakes;
  try {
    mistakes = (await listMistakes(ctx.user.uid)).filter((item) => findQuestion(item.qid));
  } catch {
    root.innerHTML = `<div class="notice notice-error">Your questions could not be loaded. Refresh the page to try again.</div>`;
    return;
  }
  const crumbs = [{ label: "Home", href: "#/home" }, { label: "Test Yourself" }];
  if (!mistakes.length) {
    root.innerHTML = `${breadcrumb(crumbs)}<h1>Test Yourself</h1>
      ${emptyState("No mistakes to review right now", "When you answer a quiz question incorrectly, it is added here so you can practice it. Right now there is nothing to review.", `<a class="btn btn-primary" href="#/home">Go to Home</a>`)}`;
    return;
  }

  const available = mistakes.length;
  root.innerHTML = `
    ${breadcrumb(crumbs)}
    <h1>Test Yourself</h1>
    <section class="panel narrow">
      <p>You have <strong>${available}</strong> question${available === 1 ? "" : "s"} to review. Questions you missed more than once come up more often.</p>
      <label class="field"><span>Number of questions</span>
        <select data-count>${Array.from({ length: 9 }, (_, i) => i + 2).map((n) => `<option value="${n}" ${n === Math.min(5, Math.max(2, available)) ? "selected" : ""}>${n}</option>`).join("")}</select>
      </label>
      <p class="muted" data-note></p>
      <button class="btn btn-primary" type="button" data-start>Start practice</button>
    </section>`;

  const select = root.querySelector("[data-count]");
  const note = root.querySelector("[data-note]");
  const updateNote = () => {
    note.textContent = Number(select.value) > available
      ? `You only have ${available} question${available === 1 ? "" : "s"} to review, so this session will have ${available}.`
      : "";
  };
  select.addEventListener("change", updateNote);
  updateNote();
  root.querySelector("[data-start]").addEventListener("click", () => {
    runPractice(root, ctx, pickQuestions(mistakes, Number(select.value)));
  });
}

function runPractice(root, ctx, picked) {
  const answers = [];
  let index = 0;
  const crumbs = [{ label: "Home", href: "#/home" }, { label: "Test Yourself", href: "#/practice" }, { label: "Session" }];

  const draw = () => {
    const { question } = findQuestion(picked[index].qid);
    root.innerHTML = `
      ${breadcrumb(crumbs)}
      <header class="lesson-head">
        <div><h1>Test Yourself</h1></div>
        <div class="lesson-progress"><span class="meter"><span style="width:${((index + 1) / picked.length) * 100}%"></span></span><small>Question ${index + 1} of ${picked.length}</small></div>
      </header>
      <section class="question quiz-question">
        <div data-speakable data-voice="mario">
          <div class="q-speak">${speakButton("Listen to the question")}</div>
          <p class="q-stem" dir="ltr">${esc(question.prompt)}</p>
          <div class="options" role="group" aria-label="Answer choices">${optionsHtml(question)}</div>
        </div>
        <div class="q-feedback" aria-live="polite"></div>
      </section>`;
    root.querySelectorAll("[data-option]").forEach((button) => {
      button.addEventListener("click", () => {
        const chosen = Number(button.dataset.option);
        const right = chosen === question.answer;
        answers.push({ qid: picked[index].qid, selected: chosen, correct: right });
        root.querySelectorAll("[data-option]").forEach((option, i) => {
          option.disabled = true;
          option.classList.toggle("is-correct", i === question.answer);
          option.classList.toggle("is-wrong", i === chosen && !right);
        });
        const last = index === picked.length - 1;
        root.querySelector(".q-feedback").innerHTML = `
          <div class="feedback ${right ? "feedback-right" : "feedback-wrong"}">
            <div class="feedback-mario">${marioImage(right ? "happy" : "angry")}</div>
            <div class="feedback-text" data-speakable data-voice="mario">
              <header><strong>${right ? "Correct!" : `Not quite. The answer is ${LETTERS[question.answer]}.`}</strong>${speakButton("Listen to the explanation")}</header>
              ${whyHtml(question)}
            </div>
          </div>
          <div class="quiz-nav"><span></span><button class="btn btn-primary" type="button" data-continue>${last ? "See results" : "Next question"}</button></div>`;
        root.querySelector("[data-continue]").addEventListener("click", () => {
          if (last) finishPractice(); else { index += 1; draw(); window.scrollTo({ top: 0 }); }
        });
        root.querySelector(".feedback").scrollIntoView({ block: "nearest" });
      });
    });
  };

  const finishPractice = async () => {
    const score = answers.filter((answer) => answer.correct).length;
    const attempt = { type: "practice", chapterId: null, score, total: answers.length, answers };
    root.innerHTML = loadingHtml("Saving your session");
    let saved = true;
    try {
      await recordAttempt(ctx.user.uid, ctx.profile, attempt);
    } catch {
      saved = false;
      toast("This session could not be saved. Check your connection.", "error");
    }
    const good = score / answers.length >= PASS_SCORE / QUIZ_SIZE;
    const message = good ? MESSAGES.good : MESSAGES.low;
    root.innerHTML = `
      ${breadcrumb(crumbs)}
      <h1>Session result</h1>
      ${saved ? "" : `<div class="notice notice-error">This session was not saved to your account.</div>`}
      ${scoreCard({
        score, total: answers.length, good, title: message.title, text: message.text,
        extra: `<div class="actions"><a class="btn btn-primary" href="#/practice">Practice again</a><a class="btn btn-secondary" href="#/home">Back to Home</a></div>`
      })}
      ${reviewHtml(answers)}`;
    bindReview(root);
    window.scrollTo({ top: 0 });
  };

  draw();
}
