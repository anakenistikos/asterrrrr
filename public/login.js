// Firebase SDK 불러오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 로그인 이벤트
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const handle = document.getElementById("loginHandle").value.trim();
  const password = document.getElementById("password").value;

  try {
    const q = query(collection(db, "users"), where("handle", "==", handle));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("No account found with that handle.");
      return;
    }

    const email = snapshot.docs[0].data().email;

    await signInWithEmailAndPassword(auth, email, password);

    alert(`Welcome back, ${handle}!`);
    window.location.href = "home.html";
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});
