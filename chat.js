import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, addDoc, onSnapshot, query, orderBy, where, serverTimestamp, doc, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const activeUsersArea = document.getElementById('activeUsersArea');

let currentUser = null;
let currentUserName = "Student";

// ==========================================
// 🛡️ AUTH & PRESENCE SETUP
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
            currentUserName = userDoc.data().name;
            // Force online status to true when they enter the chat
            await updateDoc(doc(db, "users", user.uid), { onlineStatus: true });
        }
        
        loadMessages();
        loadActiveUsers(); // Start tracking who is online
    } else {
        window.location.href = "index.html";
    }
});

// ==========================================
// 🟢 LOAD ACTIVE USERS
// ==========================================
function loadActiveUsers() {
    // Look for all users where onlineStatus is true
    const q = query(collection(db, "users"), where("onlineStatus", "==", true));
    
    onSnapshot(q, (snapshot) => {
        activeUsersArea.innerHTML = ''; // Clear the bar before redrawing
        
        if (snapshot.empty) {
            activeUsersArea.innerHTML = '<span style="color: var(--text-muted); font-size: 0.9rem;">No one else is online right now.</span>';
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            // Get the first letter of their name for the avatar bubble (default to 'S' if missing)
            const initial = data.name ? data.name.charAt(0).toUpperCase() : 'S';
            
            const userBubble = document.createElement('div');
            userBubble.className = 'user-avatar';
            userBubble.innerHTML = `
                ${initial}
                <div class="online-dot"></div>
                <span class="user-name-tooltip">${data.name || 'Student'}</span>
            `;
            activeUsersArea.appendChild(userBubble);
        });
    });
}

// ==========================================
// 💬 SEND & LOAD MESSAGES
// ==========================================
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser) return;
    
    messageInput.value = ""; // Clear input instantly for better UX

    try {
        await addDoc(collection(db, "globalChats"), {
            message: text,
            senderId: currentUser.uid,
            senderName: currentUserName,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending message: ", error);
        alert("Could not send message.");
    }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') sendMessage(); 
});

function loadMessages() {
    const q = query(collection(db, "globalChats"), orderBy("timestamp", "asc"));
    
    onSnapshot(q, (snapshot) => {
        messagesArea.innerHTML = ''; 
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const isMyMessage = data.senderId === currentUser.uid;
            
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${isMyMessage ? 'my-message' : 'other-message'}`;
            
            msgDiv.innerHTML = `
                ${!isMyMessage ? `<div class="sender-name">${data.senderName}</div>` : ''}
                <div>${data.message}</div>
            `;
            messagesArea.appendChild(msgDiv);
        });
        
        // Auto-scroll to the bottom of the chat
        messagesArea.scrollTop = messagesArea.scrollHeight;
    });
}

// ==========================================
// 🔌 AUTOMATIC OFFLINE DETECTION
// ==========================================
// When the user closes the browser tab, tell Firebase they left!
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        updateDoc(doc(db, "users", currentUser.uid), { onlineStatus: false });
    }
});