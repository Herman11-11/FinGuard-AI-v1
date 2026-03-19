import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCXH5URxOiMo0xU4bIywLfj-smPIAmBctQ",
  authDomain: "finguard-ai-15d75.firebaseapp.com",
  projectId: "finguard-ai-15d75",
  storageBucket: "finguard-ai-15d75.firebasestorage.app",
  messagingSenderId: "462766553478",
  appId: "1:462766553478:web:0865f7fea73102c74ad407",
  measurementId: "G-RDPHGB8NWE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut, signInWithEmailAndPassword };
