// src/components/RequireAuth.tsx
import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export function RequireAuth() {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    // While loading, we already gate in AuthProvider, but guard here anyway
    if (loading) {
        return null; // or a spinner
    }

    if (!user) {
        // redirect to /login but remember where we were trying to go
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}