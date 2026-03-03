import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, addDoc, onSnapshot, query, where, getDocs, updateDoc, doc, limit 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Elements
const statusText = document.getElementById('statusText');
const scoreboard = document.getElementById('scoreboard');
const myScoreEl = document.getElementById('myScore');
const oppScoreEl = document.getElementById('oppScore');
const questionArea = document.getElementById('questionArea');
const questionText = document.getElementById('questionText');
const optionsGrid = document.getElementById('optionsGrid');
const waitText = document.getElementById('waitingForOpponent');

// Game State Variables
let currentUser = null;
let currentRoomId = null;
let playerRole = null; // 'player1' or 'player2'
let unsubscribe = null;
let hasAnsweredCurrent = false;

// Sample Questions (Could be fetched from Firestore later)
const questions = [
    { q: "What does HTML stand for?", options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks Text Language", "Hyper Tool Multi Language"], ans: 0 },
    { q: "Which language runs in a web browser?", options: ["Java", "C", "Python", "JavaScript"], ans: 3 },
    { q: "What does CSS stand for?", options: ["Creative Style Sheets", "Cascading Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"], ans: 1 }
];

// ==========================================
// 🛡️ AUTH & MATCHMAKING
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        findOrCreateRoom();
    } else {
        window.location.href = "login.html";
    }
});

async function findOrCreateRoom() {
    statusText.innerText = "Searching for opponent...";
    
    const q = query(collection(db, "quizRooms"), where("status", "==", "waiting"), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // JOIN EXISTING ROOM
        const roomDoc = querySnapshot.docs[0];
        currentRoomId = roomDoc.id;
        playerRole = "player2";

        await updateDoc(doc(db, "quizRooms", currentRoomId), {
            player2: currentUser.uid,
            status: "playing"
        });
        listenToRoom();
    } else {
        // CREATE NEW ROOM
        playerRole = "player1";
        const newRoom = await addDoc(collection(db, "quizRooms"), {
            player1: currentUser.uid,
            player2: null,
            status: "waiting",
            currentQIndex: 0,
            p1Score: 0,
            p2Score: 0,
            p1Answered: false,
            p2Answered: false
        });
        currentRoomId = newRoom.id;
        listenToRoom();
    }
}

// ==========================================
// 🔄 REAL-TIME GAME LOOP
// ==========================================
function listenToRoom() {
    unsubscribe = onSnapshot(doc(db, "quizRooms", currentRoomId), (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        // Update Scores
        myScoreEl.innerText = playerRole === "player1" ? data.p1Score : data.p2Score;
        oppScoreEl.innerText = playerRole === "player1" ? data.p2Score : data.p1Score;

        if (data.status === "waiting") {
            statusText.innerText = "Waiting for an opponent...";
        }

        if (data.status === "playing") {
            statusText.style.display = "none";
            scoreboard.style.display = "flex";
            questionArea.style.display = "block";

            // If it's a new question, reset local state
            if (!hasAnsweredCurrent || optionsGrid.dataset.qIndex !== data.currentQIndex.toString()) {
                hasAnsweredCurrent = false;
                waitText.style.display = "none";
                renderQuestion(data.currentQIndex);
            }

            // Host Logic: If both players answered, move to next question or end game
            if (playerRole === "player1" && data.p1Answered && data.p2Answered) {
                setTimeout(async () => {
                    const nextIndex = data.currentQIndex + 1;
                    if (nextIndex < questions.length) {
                        await updateDoc(doc(db, "quizRooms", currentRoomId), {
                            currentQIndex: nextIndex,
                            p1Answered: false,
                            p2Answered: false
                        });
                    } else {
                        await updateDoc(doc(db, "quizRooms", currentRoomId), { status: "finished" });
                    }
                }, 1500); // 1.5s delay so players see what happened
            }
        }

        if (data.status === "finished") {
            questionArea.style.display = "none";
            statusText.style.display = "block";
            
            // Determine Winner
            let resultTxt = "It's a Tie!";
            if (data.p1Score > data.p2Score) resultTxt = playerRole === "player1" ? "🏆 YOU WON!" : "💀 YOU LOST";
            if (data.p2Score > data.p1Score) resultTxt = playerRole === "player2" ? "🏆 YOU WON!" : "💀 YOU LOST";

            statusText.innerText = `Game Over!\n${resultTxt}`;
        }
    });
}

// ==========================================
// 📝 RENDER & SUBMIT ANSWERS
// ==========================================
function renderQuestion(index) {
    const qData = questions[index];
    questionText.innerText = qData.q;
    optionsGrid.innerHTML = '';
    optionsGrid.dataset.qIndex = index; // Store current index in DOM

    qData.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => submitAnswer(i, qData.ans, btn);
        optionsGrid.appendChild(btn);
    });
}

async function submitAnswer(selectedIndex, correctIndex, btnElement) {
    if (hasAnsweredCurrent) return;
    hasAnsweredCurrent = true;

    // UI Updates
    btnElement.classList.add('selected');
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);
    waitText.style.display = "block";

    // DB Updates
    const roomRef = doc(db, "quizRooms", currentRoomId);
    const updateData = {};
    
    // Check if correct
    if (selectedIndex === correctIndex) {
        // We can't easily read current score and add 1 without a transaction, 
        // but for a simple game, we can fetch the snapshot, add 1, and write.
        btnElement.style.backgroundColor = "#27ae60"; // Green for right
        updateData[playerRole === "player1" ? "p1Score" : "p2Score"] = parseInt(myScoreEl.innerText) + 10;
    } else {
        btnElement.style.backgroundColor = "#c0392b"; // Red for wrong
    }

    updateData[playerRole === "player1" ? "p1Answered" : "p2Answered"] = true;
    await updateDoc(roomRef, updateData);
}

// Clean up listener when leaving page
window.addEventListener('beforeunload', () => {
    if (unsubscribe) unsubscribe();
});