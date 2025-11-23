import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export function EventsPage() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([
    { code: "DEMO123", name: "Demo Event 1", joined: false },
    { code: "DEMO456", name: "Demo Event 2", joined: false },
  ]);
  const [open, setOpen] = useState(false);
  const [eventCode, setEventCode] = useState("");
  const [error, setError] = useState("");

  // Load joined events from localStorage on mount
  useEffect(() => {
    if (user) {
      const storageKey = `joinedEvents_${user.uid}`;
      const savedJoinedEvents = localStorage.getItem(storageKey);
      if (savedJoinedEvents) {
        const joinedCodes = JSON.parse(savedJoinedEvents);
        setEvents((prev) =>
          prev.map((event) => ({
            ...event,
            joined: joinedCodes.includes(event.code),
          }))
        );
      }
    }
  }, [user]);

  const handleJoinEvent = () => {
    if (eventCode.trim() && user) {
      const code = eventCode.trim().toUpperCase();

      // Check if event already exists
      const existingEvent = events.find((e) => e.code === code);

      if (existingEvent) {
        // Mark existing event as joined
        setEvents((prev) =>
          prev.map((e) => (e.code === code ? { ...e, joined: true } : e))
        );

        // Save to localStorage
        const storageKey = `joinedEvents_${user.uid}`;
        const savedJoinedEvents = localStorage.getItem(storageKey);
        const joinedCodes = savedJoinedEvents
          ? JSON.parse(savedJoinedEvents)
          : [];

        if (!joinedCodes.includes(code)) {
          joinedCodes.push(code);
          localStorage.setItem(storageKey, JSON.stringify(joinedCodes));
        }

        // Stay on events page - don't navigate
        setEventCode("");
        setError("");
        setOpen(false);
      } else {
        // Show error message
        setError("That code does not exist. Please check and try again.");
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h4" gutterBottom align="center">
          Events
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            justifyContent: "center",
          }}
        >
          {events.map((event) => (
            <Box
              key={event.code}
              sx={{ flex: "1 1 300px", maxWidth: 400 }}
            >
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6">{event.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Code: {event.code}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    component={Link}
                    to={`/events/${event.code}`}
                  >
                    View Contacts
                  </Button>
                  {event.joined && (
                    <Button
                      size="small"
                      component={Link}
                      to={`/nearby/${event.code}`}
                    >
                      Find Nearby
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Event Code Dialog */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setError("");
          setEventCode("");
        }}
      >
        <DialogTitle>Join Event</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Event Code"
            fullWidth
            variant="outlined"
            value={eventCode}
            onChange={(e) => {
              setEventCode(e.target.value.toUpperCase());
              setError("");
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleJoinEvent();
              }
            }}
          />
          {error && (
            <Typography
              color="error"
              variant="body2"
              sx={{ mt: 1, fontSize: "0.875rem" }}
            >
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setError("");
              setEventCode("");
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleJoinEvent} variant="contained">
            Join
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
