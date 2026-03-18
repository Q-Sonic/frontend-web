import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAnTXG6W-i1XqlONzJfd_0GXWv5fbUktVE',
  authDomain: 'q-sonic.firebaseapp.com',
  projectId: 'q-sonic',
  storageBucket: 'q-sonic.firebasestorage.app',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
