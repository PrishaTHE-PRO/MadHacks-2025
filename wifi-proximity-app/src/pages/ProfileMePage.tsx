import { Link } from "react-router-dom";

export function ProfileMePage() {
  return (
    <div className="profile-me-page">
      <h1>My Profile</h1>
      <div className="profile-info">
        <p>Name: User Name</p>
        <p>Bio: Your bio here</p>
        <p>Interests: Interest 1, Interest 2</p>
      </div>
      <Link to="/profile/edit">Edit Profile</Link>
    </div>
  );
}
