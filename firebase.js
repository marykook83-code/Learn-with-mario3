export { auth, db } from "./firebase-config.js";

export {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
