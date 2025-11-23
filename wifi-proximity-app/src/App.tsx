// src/App.tsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useContext, type ReactElement } from "react";
import { AnimatePresence } from "framer-motion";
import { AuthContext } from "./context/AuthContext";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { ProfileMePage } from "./pages/ProfileMePage";
import { PublicProfilePage } from "./pages/PublicProfilePage";
import { ProfileViewPage } from "./pages/ProfileViewPage";
import { NearbyPage } from "./pages/NearbyPage";
import { EventContactsPage } from "./pages/EventContactsPage";
import { MapEventsPage } from "./pages/MapEventsPage";

import { PageTransition } from "./components/PageTransition";

function RequireAuth({ children }: { children: ReactElement }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // 🔄 While Firebase is restoring the session, don't redirect anywhere
  if (loading) {
    return (
      <PageTransition>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Loading session…
        </div>
      </PageTransition>
    );
  }

  if (!user) {
    // optional: remember where they were trying to go
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PageTransition>
              <LandingPage />
            </PageTransition>
          }
        />

        <Route
          path="/login"
          element={
            <PageTransition>
              <LoginPage />
            </PageTransition>
          }
        />

        <Route
          path="/signup"
          element={
            <PageTransition>
              <SignupPage />
            </PageTransition>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <PageTransition>
                <DashboardPage />
              </PageTransition>
            </RequireAuth>
          }
        />

        <Route
          path="/profile/edit"
          element={
            <RequireAuth>
              <PageTransition>
                <ProfileEditPage />
              </PageTransition>
            </RequireAuth>
          }
        />

        <Route
          path="/profile/me"
          element={
            <RequireAuth>
              <PageTransition>
                <ProfileMePage />
              </PageTransition>
            </RequireAuth>
          }
        />

        {/* Public profile by slug */}
        <Route
          path="/p/:slug"
          element={
            <PageTransition>
              <PublicProfilePage />
            </PageTransition>
          }
        />

        {/* Viewing someone else's profile */}
        <Route
          path="/profile/view/:slug"
          element={
            <RequireAuth>
              <PageTransition>
                <ProfileViewPage />
              </PageTransition>
            </RequireAuth>
          }
        />

        {/* Nearby page */}
        <Route
          path="/nearby/:eventCode"
          element={
            <RequireAuth>
              <PageTransition>
                <NearbyPage />
              </PageTransition>
            </RequireAuth>
          }
        />

        {/* Contacts page WITHOUT EventsPage */}
        <Route
          path="/events/:eventCode"
          element={
            <RequireAuth>
              <PageTransition>
                <EventContactsPage />
              </PageTransition>
            </RequireAuth>
          }
        />

        {/* Map of nearby events (GPS + Mapbox) */}
        <Route
          path="/map"
          element={
            <PageTransition>
              <MapEventsPage />
            </PageTransition>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
