import { useParams } from "react-router-dom";

export function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="public-profile-page">
      <h1>Profile: {slug}</h1>
      <div className="profile-info">
        <p>Name: User Name</p>
        <p>Bio: User bio here</p>
        <p>Interests: Interest 1, Interest 2</p>
      </div>
    </div>
  );
}
