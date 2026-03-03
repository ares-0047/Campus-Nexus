import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, addDoc, onSnapshot, query, orderBy, where, serverTimestamp, doc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Elements
const userList = document.getElementById('userList');
const emptyState = document.getElementById('emptyState');
const activeChatUI = document.getElementById('activeChatUI');
const chatHeaderName = document.getElementById('headerName');
const chatHeaderAvatar = document.getElementById('headerAvatar');
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

let currentUser = null;
let currentUserName = "Student";
let selectedUserId = null;
let currentRoomId = null;
let messagesListener = null; // To stop listening to old chats when switching users

// ==========================================
// 🛡️ AUTH SETUP
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) currentUserName = userDoc.data().name;
        
        loadCampusDirectory();
    } else {
        window.location.href = "login.html";
    }
});

// ==========================================
// 👥 LOAD ALL USERS
// ==========================================
function loadCampusDirectory() {
    // Fetch everyone from the users collection
    const q = query(collection(db, "users"), orderBy("name"));
    
    onSnapshot(q, (snapshot) => {
        userList.innerHTML = ''; 
        
        snapshot.forEach((userDoc) => {
            const data = userDoc.data();
            
            // Don't show yourself in the list!
            if (data.uid === currentUser.uid) return;
            
            const initial = data.name ? data.name.charAt(0).toUpperCase() : '?';
            const isOnline = data.onlineStatus ? 'is-online' : '';

            const userBtn = document.createElement('div');
            userBtn.className = 'user-item';
            // Keep it highlighted if it's the currently selected user
            if (selectedUserId === data.uid) userBtn.classList.add('active'); 
            
            userBtn.innerHTML = `
                <div class="user-avatar-small">
                    ${initial}
                    <div class="online-dot ${isOnline}"></div>
                </div>
                <span>${data.name}</span>
            `;

            // When you click a user...
            userBtn.addEventListener('click', () => {
                // Remove active class from all, add to this one
                document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
                userBtn.classList.add('active');
                
                openPrivateChat(data.uid, data.name, initial);
            });

            userList.appendChild(userBtn);
        });
    });
}

// ==========================================
// 🔐 OPEN PRIVATE CHAT ROOM
// ==========================================
function openPrivateChat(targetUid, targetName, targetInitial) {
    selectedUserId = targetUid;
    
    // UI Update
    emptyState.style.display = 'none';
    activeChatUI.style.display = 'flex';
    chatHeaderName.innerText = targetName;
    chatHeaderAvatar.innerText = targetInitial;
    messagesArea.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--text-muted);">Loading messages...</div>';

    // 🔑 THE MAGIC TRICK: Generate a unique ID that is the same for both users
    // Sort the two UIDs alphabetically and combine them. 
    // This ensures UserA + UserB creates the exact same room string as UserB + UserA.
    currentRoomId = [currentUser.uid, selectedUserId].sort().join('_');

    // Load messages for this specific room
    loadPrivateMessages();
}

// ==========================================
// 💬 SEND & LOAD MESSAGES
// ==========================================
async function sendPrivateMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentRoomId || !currentUser) return;
    
    messageInput.value = ""; 

    try {
        await addDoc(collection(db, "privateMessages"), {
            roomId: currentRoomId, // Tie the message to the secret room!
            message: text,
            senderId: currentUser.uid,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending DM: ", error);
        alert("Could not send message.");
    }
}

sendBtn.addEventListener('click', sendPrivateMessage);
messageInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') sendPrivateMessage(); 
});

function loadPrivateMessages() {
    // If we are already listening to another chat, stop it first!
    if (messagesListener) messagesListener();

    // Query: Get messages ONLY for this specific roomId
    const q = query(
        collection(db, "privateMessages"), 
        where("roomId", "==", currentRoomId),
        orderBy("timestamp", "asc")
    );
    
    messagesListener = onSnapshot(q, (snapshot) => {
        messagesArea.innerHTML = ''; 
        
        if (snapshot.empty) {
            messagesArea.innerHTML = `<div style="text-align:center; padding:1rem; color:var(--text-muted);">Start the conversation!</div>`;
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const isMyMessage = data.senderId === currentUser.uid;
            
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${isMyMessage ? 'my-message' : 'other-message'}`;
            msgDiv.innerText = data.message;
            
            messagesArea.appendChild(msgDiv);
        });
        
        messagesArea.scrollTop = messagesArea.scrollHeight;
    });
}