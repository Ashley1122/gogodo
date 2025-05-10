// Import Firebase modules
import { initializeApp } from "firebase/app";
import {
    initializeAuth,
    getAuth,
    getReactNativePersistence,
    createUserWithEmailAndPassword,
    signOut,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updateEmail,
    verifyBeforeUpdateEmail,
    signInAnonymously,
    fetchSignInMethodsForEmail,
    applyActionCode,
    verifyPasswordResetCode,
    confirmPasswordReset,
    updateProfile,
    User
} from "firebase/auth";
import {
    initializeFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    deleteDoc,
    serverTimestamp,
    onSnapshot,
    writeBatch,
    getCountFromServer,
    orderBy,
    where,
    and,
    or,
    addDoc
} from "firebase/firestore";
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    uploadBytes
} from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCEM6f-hOYQZT-GOmE498tzKs5-ONEvO3g",
    authDomain: "sis-neau.firebaseapp.com",
    projectId: "sis-neau",
    storageBucket: "sis-neau.appspot.com",
    messagingSenderId: "659293560277",
    appId: "1:659293560277:web:57a27ea0f11f1432c6315c",
    measurementId: "G-3YKCJYPPSJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore with persistent cache
const db = initializeFirestore(app, {
    localCache: {
        kind: "persistent", // Enable IndexedDB persistence
    }
});

// Initialize Firebase Storage
const storage = getStorage(app);

// Export services
export {
    updateEmail,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    sendPasswordResetEmail,
    serverTimestamp,
    deleteDoc,
    sendEmailVerification,
    query,
    db,
    collection,
    doc,
    setDoc,
    getDocs,
    ref,
    storage,
    uploadBytesResumable,
    getDownloadURL,
    getDoc,
    createUserWithEmailAndPassword,
    signOut,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    auth,
    verifyBeforeUpdateEmail,
    signInAnonymously,
    fetchSignInMethodsForEmail,
    applyActionCode,
    verifyPasswordResetCode,
    confirmPasswordReset,
    onSnapshot,
    uploadBytes,
    updateProfile,
    writeBatch,
    getCountFromServer,
    orderBy,
    where,
    and,
    or,
    addDoc,
    User
};
