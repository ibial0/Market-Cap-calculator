import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAT_XxlSR8P0j0uUGyWxbKSRdosaguq4vA",
  authDomain: "mc-cala.firebaseapp.com",
  projectId: "mc-cala",
  storageBucket: "mc-cala.firebasestorage.app",
  messagingSenderId: "319423941518",
  appId: "1:319423941518:web:110a2df8b9c69710c5b2df",
  measurementId: "G-PVWND42M7E"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
