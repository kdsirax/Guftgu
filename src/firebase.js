// Import the functions needed from the SDKs needed
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
 apiKey: process.env.REACT_APP_FIREBASE_KEY,
  authDomain: "guftgu-chat.firebaseapp.com",
  projectId: "guftgu-chat",
  storageBucket: "guftgu-chat.firebasestorage.app",
  messagingSenderId: "956850345668",
  appId: "1:956850345668:web:1d342bf9e1d47cba801b91"
};



// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const storage = getStorage();
export const db = getFirestore();