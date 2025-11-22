import { auth } from "./firebaseClient";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function authFetch(path, options = {}) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in");
    const idToken = await user.getIdToken();

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
            ...(options.headers || {})
        }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
}

// You’ll add more as you implement backend routes
export const api = {
    getMyProfile: () => authFetch("/profiles/me"),
    updateMyProfile: (profile) =>
        authFetch("/profiles/me", {
            method: "PUT",
            body: JSON.stringify(profile)
        })
};
