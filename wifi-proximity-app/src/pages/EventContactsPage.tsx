import { useParams } from "react-router-dom";

export function EventContactsPage() {
  const { eventCode } = useParams<{ eventCode: string }>();

  return (
    <div className="event-contacts-page">
      <h1>Event Contacts</h1>
      <p>Event Code: {eventCode}</p>
      <div className="contacts-list">
        <p>People you've met at this event will appear here.</p>
      </div>
    </div>
  );
}
