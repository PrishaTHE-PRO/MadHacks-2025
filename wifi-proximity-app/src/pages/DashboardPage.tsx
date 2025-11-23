// src/pages/DashboardPage.tsx
import { Link, useNavigate } from "react-router-dom";
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
import graingerHallImg from "../assets/graingerhall.jpeg";
import unionSouthImg from "../assets/unionsouth.jpeg";
import { useTheme } from "@mui/material/styles";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import { fadeUp, popIn, float } from "../styles/animations";

type EventItem = {
  code: string;
  name: string;
  date: string;
  time: string;
  location: string;
  joined: boolean;
  image: string;
};

export function DashboardPage() {
  const { toggleColorMode } = useContext(ColorModeContext);
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const navigate = useNavigate();

  const username =
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "guest");

  const [events, setEvents] = useState<EventItem[]>([
    {
      code: "DEMO123",
      name: "Demo Event 1",
      date: "Nov 23, 2025",
      time: "2:00–4:00 PM",
      location: "Union South, UW–Madison",
      joined: false,
      image: unionSouthImg,
    },
    {
      code: "DEMO456",
      name: "Demo Event 2",
      date: "Nov 24, 2025",
      time: "10:00–11:30 AM",
      location: "Grainger Hall",
      joined: false,
      image: graingerHallImg,
    },
  ]);

  const [open, setOpen] = useState(false);
  const [eventCode, setEventCode] = useState("");

  // Load joined events from localStorage on mount
  useEffect(() => {
    if (user) {
      const storageKey = `joinedEvents_${user.uid}`;
      const savedJoinedEvents = localStorage.getItem(storageKey);
      if (savedJoinedEvents) {
        const joinedCodes: string[] = JSON.parse(savedJoinedEvents);
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
    if (!eventCode.trim() || !user) return;

    const code = eventCode.trim().toUpperCase();
    const storageKey = `joinedEvents_${user.uid}`;

    setEvents((prevEvents) => {
      const existingEvent = prevEvents.find((e) => e.code === code);
      let nextEvents: EventItem[];

      if (existingEvent) {
        // mark existing event as joined
        nextEvents = prevEvents.map((e) =>
          e.code === code ? { ...e, joined: true } : e
        );
      } else {
        // new event with placeholder meta + default image
        nextEvents = [
          ...prevEvents,
          {
            code,
            name: `Event ${eventCode}`,
            date: "TBD",
            time: "TBD",
            location: "TBD",
            joined: true,
            image: unionSouthImg,
          },
        ];
      }

      // update joined codes in localStorage
      const savedJoinedEvents = localStorage.getItem(storageKey);
      const joinedCodes: string[] = savedJoinedEvents
        ? JSON.parse(savedJoinedEvents)
        : [];

      if (!joinedCodes.includes(code)) {
        joinedCodes.push(code);
        localStorage.setItem(storageKey, JSON.stringify(joinedCodes));
      }

      return nextEvents;
    });

    // navigate & reset
    navigate(`/nearby/${code}`);
    setEventCode("");
    setOpen(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor:
          theme.palette.mode === "dark"
            ? "background.default"
            : "#f5f5f7",
      }}
    >
      <Container maxWidth="lg" sx={{ pt: 10, pb: 6 }}>
        <Stack spacing={4}>
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ animation: `${fadeUp} 0.6s ease-out` }}
          >
            <Box>
              <Typography variant="h4" fontWeight={600}>
                Events Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Join events, see who’s nearby, and manage your profile.
              </Typography>
            </Box>
            <IconButton onClick={toggleColorMode}>
              {theme.palette.mode === "dark" ? (
                <LightModeIcon />
              ) : (
                <DarkModeIcon />
              )}
            </IconButton>
          </Stack>

          {/* Quick actions */}
          <Stack
            spacing={1}
            sx={{ animation: `${fadeUp} 0.7s ease-out` }}
          >
            <Typography variant="body1">
              Welcome <b>{username}</b>!
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                component={Link}
                to="/profile/me"
              >
                My Profile
              </Button>
            </Stack>
          </Stack>

          {/* Events section */}
          <Stack spacing={2}>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ animation: `${fadeUp} 0.8s ease-out` }}
            >
              Your Events
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
              }}
            >
              {events.map((event, index) => (
                <Box
                  key={event.code}
                  sx={{ flex: "1 1 300px", maxWidth: 400 }}
                >
                  <Card
                    elevation={3}
                    sx={{
                      borderRadius: 3,
                      overflow: "hidden",
                      position: "relative",
                      backgroundImage: `url(${event.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      color: "common.white",
                      animation: `${popIn} 0.4s ease-out`,
                      animationDelay: `${index * 0.05}s`,
                      animationFillMode: "backwards",
                    }}
                  >
                    {/* dark overlay */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        bgcolor: "rgba(0,0,0,0.6)",
                      }}
                    />

                    <CardContent sx={{ position: "relative" }}>
                      <Typography variant="h6" gutterBottom>
                        <b>{event.name}</b>
                      </Typography>

                      <Stack spacing={0.5}>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <CalendarMonthIcon fontSize="small" />
                          <Typography variant="body2">
                            {event.date}
                          </Typography>
                        </Stack>

                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <AccessTimeIcon fontSize="small" />
                          <Typography variant="body2">
                            {event.time}
                          </Typography>
                        </Stack>

                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <PlaceIcon fontSize="small" />
                          <Typography variant="body2">
                            {event.location}
                          </Typography>
                        </Stack>

                        <Typography
                          variant="body2"
                          sx={{ mt: 0.5, opacity: 0.85 }}
                        >
                          Code: {event.code}
                        </Typography>
                      </Stack>
                    </CardContent>

                    <CardActions sx={{ position: "relative" }}>
                      <Button
                        size="small"
                        component={Link}
                        to={`/events/${event.code}`}
                        sx={{ color: "common.white" }}
                      >
                        View Contacts
                      </Button>
                      {event.joined && (
                        <Button
                          size="small"
                          component={Link}
                          to={`/nearby/${event.code}`}
                          sx={{ color: "common.white" }}
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

      {/* Floating Join Event button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          animation: `${float} 3s ease-in-out infinite`,
        }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Join event dialog */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
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
            onChange={(e) =>
              setEventCode(e.target.value.toUpperCase())
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleJoinEvent();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
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
