# Mario's English Grammar

Interactive grammar platform for Egyptian Second Baccalaureate students.
Frontend: HTML, CSS, vanilla JavaScript. Accounts and data: Firebase (free Spark plan). Voice: the browser's built-in voice (free).
The `backend/` folder (FastAPI + Google Cloud Text-to-Speech) is optional and switched off, because Google requires billing.

```
project/
├── frontend/          the website
│   ├── js/            app code; firebase-config.js is the only file you edit for Firebase
│   ├── data/          lessons and quizzes (data/u1c1 = Unit One, Chapter One)
│   ├── css/  assets/
├── backend/           optional Google voice server (not needed for the free setup)
├── firestore.rules    database security rules
└── firebase.json
```

## 1. Firebase (free, once)

1. Firebase console > Project settings > Your apps > copy the web config into `frontend/js/firebase-config.js`. You can leave `storageBucket` as it is.
2. Authentication > Sign-in method: turn on **Google** and **Email/Password**.
3. Firestore Database: create it (production mode). Open the Rules tab, paste `firestore.rules`, Publish.
4. Do not open Storage and do not upgrade the plan. Profile pictures are saved inside Firestore as small images.

## 2. Run it on your computer

```
cd frontend
python -m http.server 5500
```
Open http://localhost:5500 (use `localhost`, not `127.0.0.1`, and do not open index.html by double-click; the page will tell you if you do).
If the terminal is inside the main project folder instead, open http://localhost:5500 and it forwards to the website automatically.
If the page shows an error box, it explains the cause. Press F12 and open the Console tab for details.

## 3. Put it online (free)

- Firebase Hosting (free on Spark): install the Firebase CLI, then run `firebase deploy` from the project folder. Or upload the `frontend` folder to a free static host such as Netlify or GitHub Pages.
- After deploying, add your site's domain in Firebase > Authentication > Settings > Authorized domains.

## About the voice

Speaker buttons use the voices installed on the student's device. Android and iPhone usually include Arabic and English voices; some Windows computers have no Arabic voice, and then Arabic text may be silent or read badly. Mixed sentences are split so Arabic and English use separate voices. Word highlighting follows the real word positions when the device reports them, and otherwise follows an estimated speed.

## Adding the next chapter

Create `frontend/data/u1c2/` with the same files as `u1c1`, import it in `frontend/data/lessons.js` and add it to `chapters` with `id: "u1c2"`, `unitNumber: 1`, `number: 2`.

## Reading Help font

For the OpenDyslexic option, download `OpenDyslexic-Regular.woff2` and place it in `frontend/assets/fonts/`.

## Optional: Google voice later

If billing becomes possible, set `API_BASE_URL` in `frontend/js/config.js` to your backend address and follow `backend/.env.example`. Google Text-to-Speech needs billing enabled.
