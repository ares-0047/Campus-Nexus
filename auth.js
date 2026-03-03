import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- SIGN UP FUNCTION ---
export async function registerUser(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create the user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      role: "student", // Default role
      onlineStatus: true
    });

    console.log("User registered successfully!");
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Error signing up:", error.message);
    alert(error.message);
  }
}

// --- LOGIN FUNCTION ---
export async function loginUser(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    
    // Set user to online when they log in
    const currentUser = auth.currentUser;
    if (currentUser) {
        await updateDoc(doc(db, "users", currentUser.uid), {
            onlineStatus: true
        });
    }

    console.log("Logged in successfully!");
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Error logging in:", error.message);
    alert("Login failed. Check your email and password.");
  }
}

// --- LOGOUT FUNCTION ---
export async function logoutUser() {
  try {
    // 1. Set the user to offline BEFORE we log them out so the green dot disappears!
    const currentUser = auth.currentUser;
    if (currentUser) {
        await updateDoc(doc(db, "users", currentUser.uid), {
            onlineStatus: false
        });
    }

    // 2. Actually log them out
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error logging out:", error.message);
  }
}

// --- AUTH STATE OBSERVER ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log(`Welcome ${userData.name}! Role: ${userData.role}`);
    }
  } else {
    console.log("No user is signed in.");
  }
});