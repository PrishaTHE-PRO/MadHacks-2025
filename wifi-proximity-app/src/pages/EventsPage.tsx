import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const [events, setEvents] = useState([
    { code: "DEMO123", name: "Demo Event 1", joined: false },
    { code: "DEMO456", name: "Demo Event 2", joined: false },
  ]);
  const [open, setOpen] = useState(false);
  const [eventCode, setEventCode] = useState("");
  const navigate = useNavigate();

  const handleJoinEvent = () => {
    if (eventCode.trim()) {
      const code = eventCode.trim().toUpperCase();

      // Check if event already exists
      const existingEvent = events.find((e) => e.code === code);

      if (existingEvent) {
        // Mark existing event as joined
        setEvents(events.map((e) =>
          e.code === code ? { ...e, joined: true } : e
        ));
      } else {
        // Add new event and mark as joined
        setEvents([
          ...events,
          { code: code, name: `Event ${eventCode}`, joined: true },
        ]);
      }

      // Navigate to nearby page for that event
      navigate(`/nearby/${code}`);
      setEventCode("");
      setOpen(false);
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
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Join Event</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Event Code"
            fullWidth
            variant="outlined"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleJoinEvent();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleJoinEvent} variant="contained">
            Join
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
