import { useParams } from "react-router-dom";

export function NearbyPage() {
  const { eventCode } = useParams<{ eventCode: string }>();

  return (
    <div className="nearby-page">
      <h1>Nearby People</h1>
      <p>Event Code: {eventCode}</p>
      <div className="nearby-list">
        <p>Searching for nearby people...</p>
      </div>
    </div>
  );
}
