import { Link } from "react-router-dom";

export function DashboardPage() {
  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      <nav>
        <Link to="/profile/me">My Profile</Link>
        <Link to="/profile/edit">Edit Profile</Link>
        <Link to="/events">Events</Link>
      </nav>
      <div className="dashboard-content">
        <p>Welcome to your dashboard!</p>
      </div>
    </div>
  );
}
