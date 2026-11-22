
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDKxJE8Nub6KOq13kXw9yGW7eC8k2I9lzU",
  authDomain: "mario-learning-faa6f.firebaseapp.com",
  projectId: "mario-learning-faa6f",
  storageBucket: "mario-learning-faa6f.firebasestorage.app",
  messagingSenderId: "688643211917",
  appId: "1:688643211917:web:2c0c16e51c43f0927e18c4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

