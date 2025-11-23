// src/services/authService.ts
import { auth } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type User,
} from "firebase/auth";

export function signup(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
}

export function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
    return signOut(auth);
}

export function subscribeToAuth(
    callback: (user: User | null) => void
) {
    // Wrap onAuthStateChanged so we can also mirror into a cookie
    return onAuthStateChanged(auth, (fbUser) => {
        const user = fbUser ?? null;

        // 🔐 Optional cookie mirror (does NOT replace Firebase auth,
        // just gives you a simple marker in document.cookie)
        if (user) {
            // 7-day cookie
            document.cookie = `sessionUid=${user.uid};path=/;max-age=604800`;
        } else {
            document.cookie = "sessionUid=;path=/;max-age=0";
        }

        callback(user);
    });
}
