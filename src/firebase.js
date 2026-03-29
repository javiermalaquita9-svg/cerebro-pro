import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcA6Qw5egpyeoCwQVtF6kkb0KJIXH5s1I",
  authDomain: "cerebro-pro.firebaseapp.com",
  projectId: "cerebro-pro",
  storageBucket: "cerebro-pro.appspot.com",
  messagingSenderId: "74862884613",
  appId: "1:74862884613:web:3f290560f568319951a96c",
  measurementId: "G-4VZW000DH1"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar los servicios que usaremos
export const auth = getAuth(app);
export const db = getFirestore(app);