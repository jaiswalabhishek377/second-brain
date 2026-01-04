// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbbuRsD5V53T7zXhFXDllI2Tc6d3Bipjg",
  authDomain: "second-brain-7ffd4.firebaseapp.com",
  projectId: "second-brain-7ffd4",
  storageBucket: "second-brain-7ffd4.firebasestorage.app",
  appId: "1:930170797128:web:c2894580ba0e9bb495ec7d",
  measurementId: "G-3506ZMSQ5D",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
// const analytics = getAnalytics(app);