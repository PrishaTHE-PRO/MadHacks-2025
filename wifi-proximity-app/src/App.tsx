import { Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { ProfileMePage } from "./pages/ProfileMePage";
import { PublicProfilePage } from "./pages/PublicProfilePage";
import { NearbyPage } from "./pages/NearbyPage";
import { EventsPage } from "./pages/EventsPage";
import { EventContactsPage } from "./pages/EventContactsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/profile/edit" element={<ProfileEditPage />} />
      <Route path="/profile/me" element={<ProfileMePage />} />
      <Route path="/p/:slug" element={<PublicProfilePage />} />
      <Route path="/nearby/:eventCode" element={<NearbyPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:eventCode" element={<EventContactsPage />} />
    </Routes>
  );
}
