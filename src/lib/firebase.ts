import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  push,
  onValue,
  increment,
  query,
  orderByChild,
  equalTo,
  remove,
  onChildAdded,
  Database
} from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyBO-1q2JTgj5w49ExP1qJWKw2Kgl-ncxNk",
  authDomain: "mail-fact.firebaseapp.com",
  databaseURL: "https://mail-fact-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mail-fact",
  storageBucket: "mail-fact.firebasestorage.app",
  messagingSenderId: "800577449702",
  appId: "1:800577449702:web:0576286f40bfac40451527"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db: Database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  ref,
  set,
  get,
  update,
  push,
  onValue,
  increment,
  query,
  orderByChild,
  equalTo,
  remove,
  onChildAdded
};

export type { User };
