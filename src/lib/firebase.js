import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyBa_pPHgQvYJQPiyOBYs-YAItaPQG_uyos",
    authDomain: "blood-donation-c34f0.firebaseapp.com",
    projectId: "blood-donation-c34f0",
    storageBucket: "blood-donation-c34f0.firebasestorage.app",
    messagingSenderId: "1098245273799",
    appId: "1:1098245273799:web:4a4fb73e47b4699bf766e2",
    measurementId: "G-BD0S0ZSYF6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app;
