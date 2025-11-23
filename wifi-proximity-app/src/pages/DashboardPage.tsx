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
  const theme = useTheme();
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([
    { code: "DEMO123", name: "Demo Event 1", joined: false },
    { code: "DEMO456", name: "Demo Event 2", joined: false },
  ]);
  const [open, setOpen] = useState(false);
  const [eventCode, setEventCode] = useState("");

  const handleJoinEvent = () => {
    if (eventCode.trim()) {
      const code = eventCode.trim().toUpperCase();

      // check if event already exists
      const existingEvent = events.find((e) => e.code === code);

      if (existingEvent) {
        // mark existing event as joined
        setEvents(
          events.map((e) =>
            e.code === code ? { ...e, joined: true } : e
          )
        );
      } else {
        // add new event and mark as joined
        setEvents([
          ...events,
          { code, name: `Event ${eventCode}`, joined: true },
        ]);
      }

      // go to nearby page for that event
      navigate(`/nearby/${code}`);
      setEventCode("");
      setOpen(false);
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
              Dashboard
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
              Welcome to your dashboard!
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
