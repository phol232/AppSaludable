import { initializeApp, getApps, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase para producción
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Reemplaza con tu API Key real
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "restaurante-b2fd2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "restaurante-b2fd2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "restaurante-b2fd2.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "343042748851",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:343042748851:web:XXXXXXXXXXXXXXXXXX", // Reemplaza con tu App ID real
};

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
  console.warn(
    '[firebase] Configuración incompleta. Revisa las variables VITE_FIREBASE_* en tu entorno.'
  );
}

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
