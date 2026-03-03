import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, addDoc, onSnapshot, query, where, getDocs, updateDoc, doc, serverTimestamp, limit 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const gameArea = document.getElementById('gameArea');
const statusText = document.getElementById('statusText');
const subText = document.getElementById('subText');

let currentUser = null;
let currentRoomId = null;
let playerRole = null; // 'player1' or 'player2'
let gameState = 'waiting'; // waiting, ready, go, finished
let unsubscribe = null; // To stop listening when we leave

// ==========================================
// 🛡️ AUTH & MATCHMAKING
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        findOrCreateRoom();
    } else {
        window.location.href = "index.html";
    }
});

async function findOrCreateRoom() {
    statusText.innerText = "Searching for opponent...";
    
    // Look for a room that only has player1 (status: waiting)
    const q = query(collection(db, "reactionRooms"), where("status", "==", "waiting"), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // JOIN EXISTING ROOM
        const roomDoc = querySnapshot.docs[0];
        currentRoomId = roomDoc.id;
        playerRole = "player2";

        await updateDoc(doc(db, "reactionRooms", currentRoomId), {
            player2: currentUser.uid,
            status: "ready" // Both players are here, start the game!
        });
        
        listenToRoom();
    } else {
        // CREATE NEW ROOM
        playerRole = "player1";
        const newRoom = await addDoc(collection(db, "reactionRooms"), {
            player1: currentUser.uid,
            player2: null,
            status: "waiting",
            p1Time: null,
            p2Time: null,
            winner: null
        });
        currentRoomId = newRoom.id;
        
        listenToRoom();
    }
}

// ==========================================
// 🔄 REAL-TIME GAME LOOP
// ==========================================
function listenToRoom() {
    unsubscribe = onSnapshot(doc(db, "reactionRooms", currentRoomId), (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        // State 1: Waiting for Player 2
        if (data.status === "waiting") {
            statusText.innerText = "Waiting for an opponent...";
            subText.innerText = "Send a friend to the hub to join!";
            setUIState('state-waiting');
        }

        // State 2: Ready (Red Screen)
        if (data.status === "ready" && gameState !== "ready") {
            gameState = "ready";
            statusText.innerText = "Wait for green...";
            subText.innerText = "Don't click yet!";
            setUIState('state-ready');

            // If I am Player 1, I act as the "Host" to trigger the green screen
            if (playerRole === "player1") {
                const randomDelay = Math.floor(Math.random() * 4000) + 2000; // 2 to 6 seconds
                setTimeout(async () => {
                    await updateDoc(doc(db, "reactionRooms", currentRoomId), { status: "go" });
                }, randomDelay);
            }
        }

        // State 3: GO! (Green Screen)
        if (data.status === "go" && gameState !== "go") {
            gameState = "go";
            statusText.innerText = "CLICK NOW!";
            subText.innerText = "";
            setUIState('state-go');
        }

        // State 4: Finished
        if (data.status === "finished") {
            gameState = "finished";
            setUIState('state-finished');
            if (data.winner === currentUser.uid) {
                statusText.innerText = "🏆 YOU WON! 🏆";
            } else if (data.winner === "tie") {
                statusText.innerText = "It's a tie!";
            } else {
                statusText.innerText = "💀 YOU LOST 💀";
            }
            subText.innerText = "Refresh to play again.";
        }
    });
}

// ==========================================
// 🖱️ CLICK HANDLING
// ==========================================
gameArea.addEventListener('click', async () => {
    if (gameState === "waiting" || gameState === "finished") return;

    if (gameState === "ready") {
        // Clicked too early! (Red screen)
        alert("You clicked too early! You lose this round.");
        await updateDoc(doc(db, "reactionRooms", currentRoomId), {
            status: "finished",
            winner: playerRole === "player1" ? "player2" : "player1" // Give win to opponent
        });
        return;
    }

    if (gameState === "go") {
        // Good click! Write time to database
        gameState = "finished"; // Stop local clicks
        statusText.innerText = "Recording time...";
        
        const updateData = {};
        updateData[playerRole === "player1" ? "p1Time" : "p2Time"] = serverTimestamp();
        await updateDoc(doc(db, "reactionRooms", currentRoomId), updateData);
        
        // Wait a tiny bit for both timestamps to register, then P1 calculates winner
        if (playerRole === "player1") {
            setTimeout(calculateWinner, 1500); 
        }
    }
});

async function calculateWinner() {
    const snap = await getDoc(doc(db, "reactionRooms", currentRoomId));
    const data = snap.data();
    
    let winnerId = "tie";
    // Check who has the earlier timestamp
    if (data.p1Time && data.p2Time) {
        if (data.p1Time.toMillis() < data.p2Time.toMillis()) winnerId = data.player1;
        else if (data.p2Time.toMillis() < data.p1Time.toMillis()) winnerId = data.player2;
    } else if (data.p1Time) {
        winnerId = data.player1; // P2 never clicked
    } else if (data.p2Time) {
        winnerId = data.player2; // P1 never clicked
    }

    await updateDoc(doc(db, "reactionRooms", currentRoomId), {
        status: "finished",
        winner: winnerId
    });
}

function setUIState(className) {
    gameArea.className = className;
}

// Clean up listener when leaving page
window.addEventListener('beforeunload', () => {
    if (unsubscribe) unsubscribe();
});