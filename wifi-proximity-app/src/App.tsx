import { Routes, Route, Navigate } from "react-router-dom";
import { useContext, type ReactElement } from "react";
import { AuthContext } from "./context/AuthContext";

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
import { Navbar } from "./components/Navbar";

function RequireAuth({ children }: { children: ReactElement }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    // You can style this however; using MUI later is fine too.
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />

        <Route
          path="/profile/edit"
          element={
            <RequireAuth>
              <ProfileEditPage />
            </RequireAuth>
          }
        />

        <Route
          path="/profile/me"
          element={
            <RequireAuth>
              <ProfileMePage />
            </RequireAuth>
          }
        />

        {/* public profile by slug – for sharing */}
        <Route path="/p/:slug" element={<PublicProfilePage />} />

        {/* Profile view page with event context */}
        <Route
          path="/profile/view/:slug"
          element={
            <RequireAuth>
              <ProfileViewPage />
            </RequireAuth>
          }
        />

        {/* proximity & events also require login */}
        <Route
          path="/nearby/:eventCode"
          element={
            <RequireAuth>
              <NearbyPage />
            </RequireAuth>
          }
        />
        <Route
          path="/events/:eventCode"
          element={
            <RequireAuth>
              <EventContactsPage />
            </RequireAuth>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
