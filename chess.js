import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, addDoc, onSnapshot, query, where, getDocs, updateDoc, doc, limit 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Elements
const statusText = document.getElementById('statusText');
const colorInfo = document.getElementById('colorInfo');

// Firebase & Player State
let currentUser = null;
let currentRoomId = null;
let playerColor = null; // 'w' (white) or 'b' (black)
let unsubscribe = null;

// Chess Engine & UI Instances
let game = new Chess();
let board = null;

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
    
    const q = query(collection(db, "chessRooms"), where("status", "==", "waiting"), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // JOIN EXISTING ROOM (Becomes Black)
        const roomDoc = querySnapshot.docs[0];
        currentRoomId = roomDoc.id;
        playerColor = 'b';
        
        await updateDoc(doc(db, "chessRooms", currentRoomId), {
            player2: currentUser.uid,
            status: "playing"
        });
        
        initGameUI('black');
        listenToRoom();
    } else {
        // CREATE NEW ROOM (Becomes White)
        playerColor = 'w';
        const newRoom = await addDoc(collection(db, "chessRooms"), {
            player1: currentUser.uid,
            player2: null,
            status: "waiting",
            fen: "start", // Standard starting board notation
            turn: "w"
        });
        currentRoomId = newRoom.id;
        
        initGameUI('white');
        listenToRoom();
    }
}

// ==========================================
// 🔄 REAL-TIME FIREBASE LOOP
// ==========================================
function listenToRoom() {
    unsubscribe = onSnapshot(doc(db, "chessRooms", currentRoomId), (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        if (data.status === "waiting") {
            statusText.innerText = "Waiting for challenger...";
        }

        if (data.status === "playing") {
            // Update status text based on turn
            if (data.turn === playerColor) {
                statusText.innerText = "Your Turn";
                statusText.style.color = "#27ae60"; // Green
            } else {
                statusText.innerText = "Opponent's Turn";
                statusText.style.color = "#e74c3c"; // Red
            }

            // Sync the local board if the database FEN is different
            if (game.fen() !== data.fen && data.fen !== "start") {
                game.load(data.fen);
                board.position(data.fen);
            }

            // Check for Checkmate
            if (game.game_over()) {
                handleGameOver();
            }
        }
    });
}

function handleGameOver() {
    let result = "Game Over!";
    if (game.in_checkmate()) {
        result = game.turn() === playerColor ? "💀 You got checkmated!" : "🏆 You won by checkmate!";
    } else if (game.in_draw() || game.in_stalemate()) {
        result = "It's a draw!";
    }
    statusText.innerText = result;
    statusText.style.color = "#f1c40f"; // Gold
}

// ==========================================
// ♟️ CHESS BOARD CONFIGURATION
// ==========================================
function initGameUI(orientation) {
    colorInfo.innerText = `You are playing as: ${orientation.toUpperCase()}`;

    const config = {
        draggable: true,
        position: 'start',
        orientation: orientation,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };
    
    board = Chessboard('myBoard', config);
}

// 1. Prevent dragging if it's not your turn or game is over
function onDragStart (source, piece, position, orientation) {
    if (game.game_over()) return false;
    if (game.turn() !== playerColor) return false;
    
    // Prevent White from touching Black pieces and vice versa
    if ((playerColor === 'w' && piece.search(/^b/) !== -1) ||
        (playerColor === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

// 2. Validate move when piece is dropped
async function onDrop (source, target) {
    // See if the move is legal
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to queen for simplicity in this build
    });

    // If illegal move, snap piece back
    if (move === null) return 'snapback';

    // If legal, immediately push the new board state to Firebase
    statusText.innerText = "Syncing move...";
    await updateDoc(doc(db, "chessRooms", currentRoomId), {
        fen: game.fen(),
        turn: game.turn()
    });
}

// 3. Update the board UI after piece snaps into place (fixes castling/promotion visual bugs)
function onSnapEnd () {
    board.position(game.fen());
}

// Clean up listener when leaving page
window.addEventListener('beforeunload', () => {
    if (unsubscribe) unsubscribe();
});