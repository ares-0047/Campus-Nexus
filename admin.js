import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, addDoc, serverTimestamp, doc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const authOverlay = document.getElementById('authOverlay');

// ==========================================
// 🛡️ ADMIN SECURITY CHECK
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
                // User is an admin, remove the loading screen
                authOverlay.style.display = 'none';
            } else {
                // User is logged in but NOT an admin
                alert("Access Denied. You do not have administrator privileges.");
                window.location.href = "dashboard.html";
            }
        } catch (error) {
            console.error("Error verifying role:", error);
            window.location.href = "dashboard.html";
        }
    } else {
        // Not logged in at all
        window.location.href = "index.html";
    }
});

// ==========================================
// 📅 ADD EVENT LOGIC
// ==========================================
document.getElementById('submitEventBtn').addEventListener('click', async () => {
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    const desc = document.getElementById('eventDesc').value.trim();

    if (!title || !date || !desc) {
        alert("Please fill out all event fields.");
        return;
    }

    try {
        await addDoc(collection(db, "events"), {
            title: title,
            date: date,
            description: desc,
            createdBy: auth.currentUser.uid,
            timestamp: serverTimestamp()
        });
        alert("Event successfully published!");
        // Clear inputs
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventDate').value = '';
        document.getElementById('eventDesc').value = '';
    } catch (error) {
        console.error("Error adding event:", error);
        alert("Failed to publish event.");
    }
});

// ==========================================
// 📚 ADD STUDY MATERIAL LOGIC
// ==========================================
document.getElementById('submitStudyBtn').addEventListener('click', async () => {
    const sem = document.getElementById('studySem').value;
    const subject = document.getElementById('studySubject').value.trim();
    const link = document.getElementById('studyLink').value.trim();

    if (!subject || !link) {
        alert("Please provide a subject and a valid link.");
        return;
    }

    try {
        await addDoc(collection(db, "studyMaterials"), {
            semester: sem,
            subject: subject,
            link: link,
            uploadedBy: auth.currentUser.uid,
            timestamp: serverTimestamp()
        });
        alert("Study material uploaded!");
        // Clear inputs
        document.getElementById('studySubject').value = '';
        document.getElementById('studyLink').value = '';
    } catch (error) {
        console.error("Error adding material:", error);
        alert("Failed to upload material.");
    }
});