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
import { useContext, useState } from "react";
import { ColorModeContext } from "../context/ColorModeContext";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "@mui/material/styles";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";

type EventItem = {
  code: string;
  name: string;
  date: string;
  time: string;
  location: string;
  joined: boolean;
};

export function DashboardPage() {
  const { toggleColorMode } = useContext(ColorModeContext);
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const navigate = useNavigate();

  const username =
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "back");

  const [events, setEvents] = useState<EventItem[]>([
    {
      code: "DEMO123",
      name: "Demo Event 1",
      date: "Nov 23, 2025",
      time: "2:00–4:00 PM",
      location: "Union South, UW–Madison",
      joined: false,
    },
    {
      code: "DEMO456",
      name: "Demo Event 2",
      date: "Nov 24, 2025",
      time: "10:00–11:30 AM",
      location: "Grainger Hall",
      joined: false,
    },
  ]);

  const [open, setOpen] = useState(false);
  const [eventCode, setEventCode] = useState("");

  const handleJoinEvent = () => {
    if (eventCode.trim()) {
      const code = eventCode.trim().toUpperCase();

      const existingEvent = events.find((e) => e.code === code);

      if (existingEvent) {
        setEvents(
          events.map((e) =>
            e.code === code ? { ...e, joined: true } : e
          )
        );
      } else {
        setEvents([
          ...events,
          {
            code,
            name: `Event ${eventCode}`,
            date: "TBD",
            time: "TBD",
            location: "TBD",
            joined: true,
          },
        ]);
      }

      navigate(`/nearby/${code}`);
      setEventCode("");
      setOpen(false);
    }
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
          {/* header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
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

          {/* quick actions */}
          <Stack spacing={1}>
            <Typography variant="body1">
              Welcome <b>{username}</b>!
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button variant="contained" component={Link} to="/profile/me">
                My Profile
              </Button>
            </Stack>
          </Stack>

          {/* events section */}
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              Your Events
            </Typography>
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
                  <Card elevation={3} sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {event.name}
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
                          color="text.secondary"
                          mt={0.5}
                        >
                          Code: {event.code}
                        </Typography>
                      </Stack>
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
            onKeyDown={(e) => {
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