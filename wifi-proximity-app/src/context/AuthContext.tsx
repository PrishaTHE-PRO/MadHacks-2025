import { createContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { subscribeToAuth } from "../services/authService";

export const AuthContext = createContext<{ user: User | null }>({
    user: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsub = subscribeToAuth(setUser);
        return () => unsub();
    }, []);

    return (
        <AuthContext.Provider value={{ user }}>
            {children}
        </AuthContext.Provider>
    );
}
