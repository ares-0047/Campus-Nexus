import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// TODO: Replace with your actual Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyDB0qZizQ-wn9CCMpzzvY6PaMyNvDylnG8",
  authDomain: "campus-nexus-dcbbf.firebaseapp.com",
  projectId: "campus-nexus-dcbbf",
  storageBucket: "campus-nexus-dcbbf.firebasestorage.app",
  messagingSenderId: "789252456353",
  appId:  "1:789252456353:web:d78a75c9daa175ee8995e0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services for use in other files
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);