import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider
} from "./firebase.js";
import { esc, marioImage } from "./ui.js";

const friendlyErrors = {
  "auth/invalid-email": "That email address does not look right.",
  "auth/missing-password": "Enter your password.",
  "auth/weak-password": "Choose a password with at least 6 characters.",
  "auth/email-already-in-use": "An account with this email already exists. Try logging in instead.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/user-not-found": "The email or password is incorrect.",
  "auth/wrong-password": "The email or password is incorrect.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  "auth/network-request-failed": "No connection. Check your internet and try again.",
  "auth/unauthorized-domain": "This website address is not allowed in Firebase yet. Add it under Authentication > Settings > Authorized domains.",
  "auth/operation-not-allowed": "This sign-in method is not turned on in Firebase yet."
};

const silentCodes = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

const googleLogo = `<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.8-2.1 5.1-4.4 6.7v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.2z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.5 46 24 46z"/><path fill="#FBBC05" d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-2.9.7-4.3v-5.7H4.5C3 17 2.2 20.4 2.2 24s.8 7 2.3 10l7.3-5.7z"/><path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.5 2 8.1 6.9 4.5 14l7.3 5.7c1.7-5.2 6.5-8.9 12.2-8.9z"/></svg>`;

async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (error.code === "auth/popup-blocked") await signInWithRedirect(auth, provider);
    else throw error;
  }
}

export function renderAuth(root, mode = "login") {
  const registering = mode === "register";
  root.innerHTML = `
    <section class="auth">
      <div class="auth-side">
        ${marioImage("smile", "auth-mario")}
      </div>
      <div class="auth-card">
        <div class="tabs" role="tablist" aria-label="Account">
          <a role="tab" aria-selected="${!registering}" href="#/auth">Log in</a>
          <a role="tab" aria-selected="${registering}" href="#/auth/register">Create account</a>
        </div>
        <button class="btn btn-google" type="button" data-google>${googleLogo} Continue with Google</button>
        <p class="divider"><span>or use your email</span></p>
        <form class="auth-form" novalidate>
          <label class="field"><span>Email</span>
            <input name="email" type="email" autocomplete="email" inputmode="email" required></label>
          <label class="field"><span>Password</span>
            <input name="password" type="password" autocomplete="${registering ? "new-password" : "current-password"}" minlength="6" required></label>
          <p class="form-error" role="alert" hidden></p>
          <button class="btn btn-primary" type="submit">${registering ? "Create account" : "Log in"}</button>
        </form>
      </div>
    </section>`;

  const form = root.querySelector(".auth-form");
  const errorBox = root.querySelector(".form-error");
  const buttons = root.querySelectorAll("button");

  const run = async (action) => {
    errorBox.hidden = true;
    buttons.forEach((button) => (button.disabled = true));
    try {
      await action();
    } catch (error) {
      if (silentCodes.has(error.code)) return;
      errorBox.textContent = friendlyErrors[error.code] || `Something went wrong (${esc(error.code || error.message)}). Try again.`;
      errorBox.hidden = false;
    } finally {
      buttons.forEach((button) => (button.disabled = false));
    }
  };

  root.querySelector("[data-google]").addEventListener("click", () => run(signInWithGoogle));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;
    if (!email || !password) {
      errorBox.textContent = "Enter your email and password.";
      errorBox.hidden = false;
      return;
    }
    run(() => (registering
      ? createUserWithEmailAndPassword(auth, email, password)
      : signInWithEmailAndPassword(auth, email, password)));
  });
}
