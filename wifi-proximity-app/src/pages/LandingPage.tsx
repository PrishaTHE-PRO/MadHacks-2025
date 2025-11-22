import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="landing-page">
      <h1>WiFi Proximity App</h1>
      <p>Connect with people nearby at events</p>
      <div>
        <Link to="/login">Login</Link>
        <Link to="/signup">Sign Up</Link>
      </div>
    </div>
  );
}
