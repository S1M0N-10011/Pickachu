import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBupafOvgVUeZtYZNr1MjaazkkOCkHEdY0",
  authDomain: "cartigotcg.firebaseapp.com",
  projectId: "cartigotcg",
  storageBucket: "cartigotcg.firebasestorage.app",
  messagingSenderId: "76587551174",
  appId: "1:76587551174:web:9d4d7f11e4a73830b64ac7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };

