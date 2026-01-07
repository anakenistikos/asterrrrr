// room.js (module)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue,
  push,
  set
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const rtdb = getDatabase(app);
const fs = getFirestore(app);

const roomId = new URLSearchParams(location.search).get("roomId");
if (!roomId) {
  alert("Missing roomId");
  location.href = "home.html";
}

let me = { uid: null, handle: "user" };

const roomTitleEl = document.getElementById("roomTitle");
const roomMetaEl = document.getElementById("roomMeta");
const messagesEl = document.getElementById("messages");
const msgForm = document.getElementById("msgForm");
const msgInput = document.getElementById("msgInput");

document.getElementById("backBtn")?.addEventListener("click", () => {
  location.href = "home.html";
});

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    location.href = "index.html";
  } catch (e) {
    alert("Logout failed: " + e.message);
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "index.html";
    return;
  }
  me.uid = user.uid;

  try {
    const snap = await getDoc(doc(fs, "users", user.uid));
    if (snap.exists()) me.handle = snap.data().handle || "user";
    else me.handle = user.email?.split("@")[0] || "user";
  } catch {
    me.handle = user.email?.split("@")[0] || "user";
  }

  subscribeRoom();
  subscribeMessages();
});

/* ===============================
   Room info
   rooms/{roomId}
================================ */
function subscribeRoom() {
  onValue(ref(rtdb, `rooms/${roomId}`), (snap) => {
    const room = snap.val();
    if (!room) {
      roomTitleEl.textContent = "Room not found";
      roomMetaEl.textContent = "This room may have been deleted.";
      return;
    }
    roomTitleEl.textContent = room.title || "Room";
    roomMetaEl.textContent = `Host: ${room.ownerHandle || "unknown"}`;
  });
}

/* ===============================
   Messages
   roomMessages/{roomId}/{msgId}
================================ */
function subscribeMessages() {
  onValue(ref(rtdb, `roomMessages/${roomId}`), (snap) => {
    const val = snap.val() || {};
    const list = Object.entries(val).map(([id, data]) => ({ id, ...data }));
    list.sort((a, b) => (a.ts || 0) - (b.ts || 0));

    messagesEl.innerHTML = "";
    for (const m of list) {
      const row = document.createElement("div");
      row.className = "msg";
      row.innerHTML = `
        <div class="meta">
          <span class="name">${escapeHtml(m.handle || "user")}</span>
          <span class="time">${fmtTime(m.ts)}</span>
        </div>
        <p class="text">${escapeHtml(m.text || "")}</p>
      `;
      messagesEl.appendChild(row);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

msgForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = (msgInput?.value || "").trim();
  if (!text) return;

  try {
    const newRef = push(ref(rtdb, `roomMessages/${roomId}`));
    await set(newRef, {
      uid: me.uid,
      handle: me.handle,
      text,
      ts: Date.now()
    });

    msgInput.value = "";
  } catch (err) {
    alert("Send failed: " + err.message);
  }
});

/* util */
function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
