import { db, doc, getDoc, setDoc, deleteDoc, collection, addDoc, getDocs, query, orderBy } from "./firebase.js";
import { chapters, units, chapterLabel } from "../data/lessons.js";
import { buildSteps } from "./steps.js";
import { PASS_SCORE } from "./config.js";
import { esc, breadcrumb, loadingHtml, icon } from "./ui.js";

export async function loadProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveProfile(uid, data) {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}

export async function saveLessonPosition(uid, profile, chapterId, step, area = "lesson") {
  const update = {
    position: { chapterId, area, step, updatedMs: Date.now() },
    lessonSteps: { [chapterId]: step }
  };
  await saveProfile(uid, update);
  profile.position = update.position;
  profile.lessonSteps = { ...(profile.lessonSteps || {}), [chapterId]: step };
}

export async function listAttempts(uid) {
  const snapshot = await getDocs(query(collection(db, "users", uid, "attempts"), orderBy("createdMs", "desc")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function getAttempt(uid, id) {
  const snapshot = await getDoc(doc(db, "users", uid, "attempts", id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function listMistakes(uid) {
  const snapshot = await getDocs(collection(db, "users", uid, "mistakes"));
  return snapshot.docs.map((item) => item.data());
}

export async function recordAttempt(uid, profile, attempt) {
  const createdMs = Date.now();
  const reference = await addDoc(collection(db, "users", uid, "attempts"), { ...attempt, createdMs });
  const known = new Map((await listMistakes(uid)).map((item) => [item.qid, item]));

  for (const answer of attempt.answers) {
    const current = known.get(answer.qid)?.wrongCount || 0;
    let next = current;
    if (!answer.correct) next = current + 1;
    else if (attempt.type === "practice") next = Math.max(0, current - 1);
    if (next === current) continue;
    const mistakeRef = doc(db, "users", uid, "mistakes", answer.qid);
    if (next > 0) {
      await setDoc(mistakeRef, { qid: answer.qid, chapterId: answer.qid.split("-")[0], wrongCount: next, lastWrongMs: createdMs });
    } else {
      await deleteDoc(mistakeRef);
    }
  }

  if (attempt.type === "quiz") {
    const previous = profile.chapters?.[attempt.chapterId] || {};
    const best = Math.max(previous.bestScore || 0, attempt.score);
    const stats = { bestScore: best, attempts: (previous.attempts || 0) + 1, completed: best >= PASS_SCORE, lastMs: createdMs };
    await saveProfile(uid, { chapters: { [attempt.chapterId]: stats } });
    profile.chapters = { ...(profile.chapters || {}), [attempt.chapterId]: stats };
  }
  return reference.id;
}

export function chapterStatus(profile, chapter) {
  const stats = profile.chapters?.[chapter.id];
  const totalSteps = buildSteps(chapter).length;
  const step = profile.lessonSteps?.[chapter.id] || 0;
  return {
    completed: Boolean(stats?.completed),
    bestScore: stats?.bestScore ?? null,
    attempts: stats?.attempts || 0,
    lessonPercent: Math.round((Math.min(step, totalSteps) / totalSteps) * 100)
  };
}

export async function renderProgress(root, { uid, profile }) {
  root.innerHTML = loadingHtml("Loading your progress");
  let attempts;
  let mistakes;
  try {
    [attempts, mistakes] = await Promise.all([listAttempts(uid), listMistakes(uid)]);
  } catch {
    root.innerHTML = `<div class="notice notice-error">Your progress could not be loaded. Check your connection and refresh the page.</div>`;
    return;
  }
  const quizAttempts = attempts.filter((item) => item.type === "quiz");
  const average = quizAttempts.length
    ? Math.round((quizAttempts.reduce((sum, item) => sum + item.score / item.total, 0) / quizAttempts.length) * 100)
    : null;
  const completed = chapters.filter((chapter) => profile.chapters?.[chapter.id]?.completed).length;

  const rows = chapters.map((chapter) => {
    const status = chapterStatus(profile, chapter);
    return `<tr>
      <td data-label="Chapter"><a href="#/chapter/${chapter.id}">${esc(chapterLabel(chapter))}</a><br><small>${esc(chapter.title)}</small></td>
      <td data-label="Lesson"><span class="meter" role="img" aria-label="${status.lessonPercent}% of the lesson"><span style="width:${status.lessonPercent}%"></span></span> ${status.lessonPercent}%</td>
      <td data-label="Best score">${status.bestScore === null ? "Not taken" : `${status.bestScore}/10`}</td>
      <td data-label="Attempts">${status.attempts}</td>
      <td data-label="Status">${status.completed ? `<span class="chip chip-done">${icon("check", 14)} Completed</span>` : `<span class="chip">In progress</span>`}</td>
    </tr>`;
  }).join("");

  root.innerHTML = `
    ${breadcrumb([{ label: "Home", href: "#/home" }, { label: "Progress" }])}
    <h1>Progress</h1>
    <div class="stats">
      <div class="stat"><strong>${completed}/${chapters.length}</strong><span>Chapters completed</span></div>
      <div class="stat"><strong>${quizAttempts.length}</strong><span>Quiz attempts</span></div>
      <div class="stat"><strong>${average === null ? "–" : `${average}%`}</strong><span>Average quiz score</span></div>
      <div class="stat"><strong>${mistakes.length}</strong><span>Questions to review</span></div>
    </div>
    <h2>Chapters</h2>
    <div class="table-wrap"><table class="table"><thead><tr><th>Chapter</th><th>Lesson</th><th>Best score</th><th>Attempts</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="muted">A chapter turns green when you score ${PASS_SCORE}/10 or more on its quiz. Chapters that are not listed yet are on the way (${units.length * 3 - chapters.length} to come).</p>
    <div class="actions"><a class="btn btn-secondary" href="#/history">Quiz History</a><a class="btn btn-secondary" href="#/practice">Test Yourself</a></div>`;
}

