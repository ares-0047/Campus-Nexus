import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, updateDoc, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;

// --- AUTHENTICATION CHECK ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadTasks(); // Load user's personal tasks
    } else {
        window.location.href = "index.html";
    }
});

// ==========================================
// ⏳ POMODORO TIMER LOGIC (Pure Vanilla JS)
// ==========================================
const timeDisplay = document.getElementById('timeDisplay');
let timerInterval;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isRunning = false;

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

document.getElementById('startTimerBtn').addEventListener('click', () => {
    if (isRunning) return;
    isRunning = true;
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timerInterval);
            isRunning = false;
            alert("Time's up! Take a 5-minute break.");
            // You could potentially log completed sessions to Firestore here!
        }
    }, 1000);
});

document.getElementById('pauseTimerBtn').addEventListener('click', () => {
    clearInterval(timerInterval);
    isRunning = false;
});

document.getElementById('resetTimerBtn').addEventListener('click', () => {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = 25 * 60;
    updateDisplay();
});

// ==========================================
// 📝 TO-DO LIST LOGIC (Firestore CRUD)
// ==========================================
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');

// 1. Add Task
document.getElementById('addTaskBtn').addEventListener('click', async () => {
    const taskText = taskInput.value.trim();
    if (taskText === "" || !currentUser) return;

    taskInput.value = ""; // Clear input

    try {
        await addDoc(collection(db, "todos"), {
            userId: currentUser.uid,
            task: taskText,
            completed: false,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding task:", error);
    }
});

// 2. Load Tasks (Real-time Listener)
function loadTasks() {
    // Query: Get ONLY tasks belonging to this user, ordered by time
    const q = query(
        collection(db, "todos"), 
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc")
    );

    onSnapshot(q, (snapshot) => {
        taskList.innerHTML = ''; // Clear list
        
        snapshot.forEach((todoDoc) => {
            const data = todoDoc.data();
            const taskId = todoDoc.id; // The unique Firestore document ID
            
            const li = document.createElement('li');
            li.className = `task-item ${data.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <span>${data.task}</span>
                <div class="task-actions">
                    <button onclick="toggleTask('${taskId}', ${data.completed})">✔️</button>
                    <button onclick="deleteTask('${taskId}')">🗑️</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    });
}

// 3. Update & Delete Functions (Attached to the window object so inline HTML onclick can see them)
window.toggleTask = async (taskId, currentStatus) => {
    try {
        const taskRef = doc(db, "todos", taskId);
        await updateDoc(taskRef, { completed: !currentStatus });
    } catch (error) {
        console.error("Error updating task:", error);
    }
};

window.deleteTask = async (taskId) => {
    try {
        await deleteDoc(doc(db, "todos", taskId));
    } catch (error) {
        console.error("Error deleting task:", error);
    }
};