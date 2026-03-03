import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, onSnapshot, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const materialsGrid = document.getElementById('materialsGrid');

// ==========================================
// 🛡️ AUTHENTICATION CHECK
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in, fetch the materials
        loadStudyMaterials();
    } else {
        // User is NOT logged in, kick them out
        window.location.href = "index.html";
    }
});

// ==========================================
// 📚 FETCH AND RENDER MATERIALS
// ==========================================
function loadStudyMaterials() {
    // Query the database, ordering by the newest uploads first
    const q = query(collection(db, "studyMaterials"), orderBy("timestamp", "desc"));

    // Set up a real-time listener
    onSnapshot(q, (snapshot) => {
        materialsGrid.innerHTML = ''; // Clear the loading text or previous items

        if (snapshot.empty) {
            materialsGrid.innerHTML = '<div class="empty-state">No study materials uploaded yet. Check back later!</div>';
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Create a new div for the card
            const card = document.createElement('div');
            card.classList.add('material-card');

            // Figure out the button text based on the link (just a neat UX trick)
            let btnText = "📄 View Material";
            if (data.link.includes('youtube.com') || data.link.includes('youtu.be')) {
                btnText = "🎥 Watch Lecture";
            }

            // Inject the HTML for the specific resource
            card.innerHTML = `
                <div>
                    <span class="semester-tag">${data.semester}</span>
                    <h3>${data.subject}</h3>
                </div>
                <a href="${data.link}" target="_blank" class="btn-view">${btnText}</a>
            `;

            // Add the card to the grid
            materialsGrid.appendChild(card);
        });
    }, (error) => {
        console.error("Error fetching study materials:", error);
        materialsGrid.innerHTML = '<div class="empty-state" style="color: #e74c3c;">Failed to load materials. Please try again.</div>';
    });
}