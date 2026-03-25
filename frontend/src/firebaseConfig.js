import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDF0TpIaI_S2H5IYFKR2gwrV1DXxXlNFzs",
  authDomain: "shareapp-67a9f.firebaseapp.com",
  projectId: "shareapp-67a9f",
  storageBucket: "shareapp-67a9f.firebasestorage.app",
  messagingSenderId: "744218399378",
  appId: "1:744218399378:web:7fa477ef9762a156cd0c4b",
  measurementId: "G-FKD57DLLEV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
