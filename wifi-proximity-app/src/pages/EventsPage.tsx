import { Link } from "react-router-dom";

export function EventsPage() {
  const events = [
    { code: "DEMO123", name: "Demo Event 1" },
    { code: "DEMO456", name: "Demo Event 2" },
  ];

  return (
    <div className="events-page">
      <h1>Events</h1>
      <div className="events-list">
        {events.map((event) => (
          <div key={event.code} className="event-item">
            <h3>{event.name}</h3>
            <p>Code: {event.code}</p>
            <Link to={`/events/${event.code}`}>View Contacts</Link>
            <Link to={`/nearby/${event.code}`}>Find Nearby</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
