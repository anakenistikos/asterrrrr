// home.js (module)

// ===== Firebase SDK Import =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase Config (same as signup/login)
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

let me = { uid: null, handle: "user" };
let cachedRooms = [];

/* ===============================
   1) 로그인 유지 확인
================================ */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  me.uid = user.uid;

  // Firestore users/{uid} 에 저장한 handle 읽어오기 (없으면 fallback)
  try {
    const snap = await getDoc(doc(fs, "users", user.uid));
    if (snap.exists()) {
      me.handle = snap.data().handle || "user";
    } else {
      me.handle = user.email?.split("@")[0] || "user";
    }
  } catch {
    me.handle = user.email?.split("@")[0] || "user";
  }

  // 로그인 확인된 이후에만 rooms 구독
  subscribeRooms();
});

/* ===============================
   2) 로그아웃
================================ */
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    alert("Logout failed: " + error.message);
  }
});

/* ===============================
   3) Rooms 구독 + 렌더
   RTDB 구조:
   rooms/{roomId} = { title, ownerUid, ownerHandle, locked, createdAt }
================================ */
function subscribeRooms() {
  const roomsRef = ref(rtdb, "rooms");
  onValue(roomsRef, (snap) => {
    const val = snap.val() || {};
    const list = Object.entries(val).map(([id, data]) => ({
      id,
      ...data
    }));

    // 최신 생성순(내림차순)
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    cachedRooms = list;

    renderRooms(list);
  });
}

function renderRooms(rooms) {
  const listEl = document.getElementById("room-list");
  if (!listEl) return;

  listEl.innerHTML = "";

  if (!rooms.length) {
    listEl.innerHTML = `
      <div style="color: var(--text-muted); padding: 8px;">
        No rooms yet. Create the first one 👀
      </div>
    `;
    return;
  }

  rooms.forEach((room) => {
    const card = document.createElement("article");
    card.className = "room-card" + (room.locked ? " room-card--locked" : "");
    card.tabIndex = 0;

    const left = document.createElement("div");
    left.className = "room-left";
    left.innerHTML = room.locked ? `<span class="room-lock">🔒</span>` : "";

    const center = document.createElement("div");
    center.className = "room-center";
    center.innerHTML = `<h2 class="room-title">${escapeHtml(room.title || "Untitled")}</h2>`;

    const right = document.createElement("div");
    right.className = "room-right";
    right.textContent = `- ${room.ownerHandle || "unknown"}`;

    card.appendChild(left);
    card.appendChild(center);
    card.appendChild(right);

    card.addEventListener("click", () => {
      window.location.href = `room.html?roomId=${encodeURIComponent(room.id)}`;
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.location.href = `room.html?roomId=${encodeURIComponent(room.id)}`;
      }
    });

    listEl.appendChild(card);
  });
}

/* ===============================
   4) Create Room / Join Random
================================ */
document.getElementById("createRoomBtn")?.addEventListener("click", async () => {
  const title = prompt("Room title?");
  if (!title) return;

  const trimmed = title.trim();
  if (!trimmed) return;

  try {
    const newRef = push(ref(rtdb, "rooms"));
    await set(newRef, {
      title: trimmed,
      ownerUid: me.uid,
      ownerHandle: me.handle,
      locked: false,
      createdAt: Date.now()
    });

    // 생성 후 바로 입장
    window.location.href = `room.html?roomId=${encodeURIComponent(newRef.key)}`;
  } catch (e) {
    alert("Create room failed: " + e.message);
  }
});

document.getElementById("joinRandomBtn")?.addEventListener("click", () => {
  const candidates = cachedRooms.filter((r) => !r.locked);
  if (!candidates.length) {
    alert("No available rooms right now.");
    return;
  }
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  window.location.href = `room.html?roomId=${encodeURIComponent(pick.id)}`;
});

/* util */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
