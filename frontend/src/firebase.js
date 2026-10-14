import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from 'firebase/auth';

// Firebase client configuration.
//
// Development: these demo values work with the local Firebase Auth
// Emulator (started via `firebase emulators:start --only auth`) — no
// real Firebase project is required.
//
// Production: replace with your real Firebase project's web config
// (Firebase Console > Project Settings > General > Your apps) via
// environment variables prefixed with VITE_.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-digi-closet.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-digi-closet',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id',
};

export const USE_AUTH_EMULATOR = import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'false';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

if (USE_AUTH_EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

export default app;
