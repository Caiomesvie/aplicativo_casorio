import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-casamento-app.firebaseapp.com",
  projectId: "seu-casamento-app",
  storageBucket: "seu-casamento-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "SEU_APP_ID_AQUI"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);