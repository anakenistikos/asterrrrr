// Firebase SDK 불러오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getFirestore, doc, setDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase 콘솔 설정
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

// Instagram-style handle validation
function validateHandle(handle) {
  // 영문자, 숫자, '.', '_' 허용 / 시작과 끝은 특수문자 불가 / 연속된 특수문자 불가 / 1~30자
  const regex = /^(?!.*[._]{2})[a-zA-Z0-9](?:[a-zA-Z0-9._]{0,28}[a-zA-Z0-9])?$/;
  return regex.test(handle);
}

// 회원가입 버튼 이벤트
document.getElementById("signupBtn").addEventListener("click", async () => {
  const handle = document.getElementById("signupHandle").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const username = document.getElementById('signupName').value.trim();
  const password = document.getElementById("signupPassword").value;

  if (!handle || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  if (!validateHandle(handle)) {
    alert("Handle can only contain letters, numbers, '.', '_' and must be 1–30 characters long.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore에 handle 저장
    await setDoc(doc(db, "users", user.uid), {
      handle: handle,
      email: email,
      createdAt: new Date()
    });

    alert("Your account has been created! Redirecting to login page...");
    window.location.href = "index.html";
  } catch (error) {
    alert("Sign up failed: " + error.message);
  }
});
