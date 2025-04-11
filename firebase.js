// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlWlkpsmqdDJv5hlilZO5cRyd3dyar-Vs",
  authDomain: "allergycheck-b48a9.firebaseapp.com",
  projectId: "allergycheck-b48a9",
  storageBucket: "allergycheck-b48a9.appspot.com",
  messagingSenderId: "1087274816798",
  appId: "1:1087274816798:web:92c5bcac40478e69af250f"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
console.log("✅ Firebase loaded and initialized.");
