import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB472NBdl3wfZkWoDSytx5WigFwGRLgFyQ",
  authDomain: "casamento-7ee73.firebaseapp.com",
  projectId: "casamento-7ee73",
  storageBucket: "casamento-7ee73.firebasestorage.app",
  messagingSenderId: "556933512166",
  appId: "1:556933512166:web:1c9c52cfba0f8c0c5ef427",
  measurementId: "G-1HD2R1V6S3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
