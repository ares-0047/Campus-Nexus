# 🎓 Campus Nexus - All-in-One Student Ecosystem <br>

**Campus Nexus** is a modern, real-time web application designed to unify campus life. It combines academic resources, productivity tools, and social interaction into a single, high-performance platform. <br><br>



---

## 🚀 Key Features <br>

### 💬 Communication Hub <br>
* **Global Campus Chat**: A real-time community chat room for all students to share updates and ask questions. <br>
* **Active Presence**: Real-time "Online" status indicators using Firestore listeners to see who's currently active. <br>
* **Direct Messaging**: Secure, private 1-on-1 chat rooms generated via unique shared room IDs. <br>

### 🎮 Velocity Gaming Hub <br>
* **Multiplayer Games**: Real-time competitive games including Lightning Reflex, Quiz Battle, and Grandmaster Chess. <br>
* **Matchmaking**: Automatic room creation and joining logic for seamless multiplayer experiences. <br>

### ✍️ Quills Study Hub <br>
* **Resource Directory**: Structured academic materials, notes, and video lectures organized by semester and subject. <br>
* **Admin Uploads**: A dedicated panel for campus admins to publish events and upload new study materials. <br>

### ⏳ Productivity Tools <br>
* **Pomodoro Timer**: A customizable focus timer to help students manage study sessions effectively. <br>
* **Personal To-Do List**: A private, persistent task manager synced to the user's account. <br>

---

## 🛠️ Technical Stack <br>

* **Frontend**: HTML5, CSS3 (Modern Glassmorphism Design), Vanilla JavaScript (ES6 Modules). <br>
* **Backend-as-a-Service**: Firebase. <br>
    * **Authentication**: Secure email/password login and registration. <br>
    * **Firestore**: Real-time NoSQL database for chats, games, and user data. <br>
    * **Cloud Storage**: (Configured for future multimedia support). <br>

---

## 🎨 UI/UX Highlights <br>

* **Glassmorphism**: Elegant frosted-glass card components with 3D hover effects. <br>
* **Dynamic Animations**: Staggered fade-in-up entry animations for a premium feel. <br>
* **Animated Gradients**: A shifting, multi-color background that creates a living aesthetic. <br>

---

## 🔧 Installation & Setup <br>

1.  **Clone the Repository**: <br>
    `git clone https://github.com/YourUsername/Campus-Nexus.git` <br><br>

2.  **Configure Firebase**: <br>
    * Create a project at [Firebase Console](https://console.firebase.google.com/). <br>
    * Enable **Authentication** (Email/Password). <br>
    * Create a **Firestore Database** in test mode. <br>
    * Copy your configuration into `firebase-config.js`. <br><br>

3.  **Run Locally**: <br>
    * Use a local server (like the "Live Server" extension in VS Code) to open `login.html`. <br>

---

## 📬 Feedback System <br>
Includes a built-in feedback portal for students to report bugs or suggest features directly to the admin panel. <br>

---
Created with ❤️ by **Ashutosh**
