import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDmMuftAqoUBEoGHXtV0C_SZVHp5KmdNn4",
  authDomain: "atividadeadaptada.firebaseapp.com",
  projectId: "atividadeadaptada",
  storageBucket: "atividadeadaptada.firebasestorage.app",
  messagingSenderId: "37982590936",
  appId: "1:37982590936:web:f0bd7b5c5dd208e26a84ad"
};

// Evita que o Next.js tente inicializar o Firebase mais de uma vez
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);