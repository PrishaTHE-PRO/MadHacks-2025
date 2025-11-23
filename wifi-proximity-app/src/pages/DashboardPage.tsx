import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext } from "../context/ColorModeContext";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "@mui/material/styles";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import AddIcon from "@mui/icons-material/Add";


type EventItem = {
  code: string;
  name: string;
  joined: boolean;
};

export function DashboardPage() {
  const { toggleColorMode } = useContext(ColorModeContext);
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  const username =
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "back");
  const [events, setEvents] = useState<EventItem[]>([
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

      // check if event already exists
      const existingEvent = events.find((e) => e.code === code);

      if (existingEvent) {
        // mark existing event as joined
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

        // Close dialog and clear form
        setEventCode("");
        setError("");
        setOpen(false);
      } else {
        // Show error message - event doesn't exist
        setError("That code does not exist. Please check and try again.");
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="lg" sx={{ pt: 10, pb: 6 }}>
        <Stack spacing={4}>
          {/* header row */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h4" fontWeight={600}>
              Events Dashboard
            </Typography>
            <IconButton onClick={toggleColorMode}>
              {theme.palette.mode === "dark" ? (
                <LightModeIcon />
              ) : (
                <DarkModeIcon />
              )}
            </IconButton>
          </Stack>

          {/* quick actions */}
          <Stack spacing={2}>
            <Typography variant="body1">
              Welcome  <b>{username}</b>!
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button variant="contained" component={Link} to="/profile/me">
                My Profile
              </Button>
            </Stack>
          </Stack>

          {/* events section */}
          <Stack spacing={2}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
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
          </Stack>
        </Stack>
      </Container>

      {/* floating Join Event button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* join event dialog */}
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
