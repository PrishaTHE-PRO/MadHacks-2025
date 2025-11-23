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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext } from "../context/ColorModeContext";
import { AuthContext } from "../context/AuthContext";
import graingerHallImg from "../assets/graingerhall.jpeg";
import unionSouthImg from "../assets/unionsouth.jpeg";
import { storage, db } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc as firestoreDoc, getDoc as getFirestoreDoc } from "firebase/firestore";
import { useTheme } from "@mui/material/styles";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import { fadeUp, popIn, float } from "../styles/animations";
import {
  createEventInDb,
  joinEventInDb,
  getEventsForUser,
  deleteEventForUser,
  type FirestoreEvent,
  type Role,
} from "../services/eventService";
import { BackButton } from "../components/BackButton";

type EventItem = {
  code: string;
  name: string;
  date: string;
  time: string;
  location: string;
  joined: boolean;
  image?: string;
  createdByUid?: string;
  role?: Role;
};

const generateEventCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const pickImageForLocation = (location: string) => {
  const loc = location.toLowerCase();
  if (loc.includes("union south")) return unionSouthImg;
  if (loc.includes("grainger")) return graingerHallImg;
  return unionSouthImg; // default
};

export function DashboardPage() {
  const { toggleColorMode } = useContext(ColorModeContext);
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const navigate = useNavigate();

  const username =
    user?.displayName || (user?.email ? user.email.split("@")[0] : "guest");

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // JOIN dialog
  const [joinOpen, setJoinOpen] = useState(false);
  const [eventCode, setEventCode] = useState("");
  const [joinRole, setJoinRole] = useState<Role>("attendee");
  const [joinError, setJoinError] = useState("");

  // CREATE dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [createRole, setCreateRole] = useState<Role>("attendee");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [newEventImageFile, setNewEventImageFile] = useState<File | null>(null);
  const [createError, setCreateError] = useState(""); // if you haven't already

  // Load events from Firestore for this user
  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoadingEvents(false);
      return;
    }

    setLoadingEvents(true);
    getEventsForUser(user.uid)
      .then((rows) => {
        const mapped: EventItem[] = rows.map(({ event, role }) => ({
          code: event.code,
          name: event.name,
          date: event.date,
          time: event.time,
          location: event.location,
          joined: true,
          image: event.imageUrl || pickImageForLocation(event.location),
          createdByUid: event.createdByUid,
          role,
        }));
        setEvents(mapped);
      })
      .finally(() => setLoadingEvents(false));
  }, [user]);

  const handleJoinEvent = async () => {
    if (!eventCode.trim() || !user) return;

    const code = eventCode.trim().toUpperCase();

    try {
      const eventData: FirestoreEvent = await joinEventInDb(
        code,
        user.uid,
        joinRole
      );

      const image = pickImageForLocation(eventData.location);

      setEvents((prev) => {
        const existing = prev.find((e) => e.code === code);
        if (existing) {
          return prev.map((e) =>
            e.code === code ? { ...e, joined: true, role: joinRole } : e
          );
        }
        return [
          ...prev,
          {
            code: eventData.code,
            name: eventData.name,
            date: eventData.date,
            time: eventData.time,
            location: eventData.location,
            joined: true,
            image,
            createdByUid: eventData.createdByUid,
            role: joinRole,
          },
        ];
      });

      // go straight to nearby view
      navigate(`/nearby/${code}`);

      setEventCode("");
      setJoinError("");
      setJoinOpen(false);
    } catch (err: any) {
      setJoinError(err.message || "Could not join event.");
    }
  };

  const handleCreateEvent = async () => {
    if (!user) return;
    if (!newEventName.trim()) {
      setCreateError("Event name is required.");
      return;
    }

    const code = generateEventCode();
    // If user entered a time but not a date, default the date to today so the time is preserved
    let computedDate = newEventDate || "";
    let time = newEventTime || "";

    // Normalize time to HH:MM format
    if (time) {
      const raw = time.trim();
      // The time input field returns "HH:MM" or "HH:MM:SS", just extract HH:MM
      const timeMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
      if (timeMatch) {
        const hh = parseInt(timeMatch[1], 10);
        const mm = parseInt(timeMatch[2], 10);
        if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
          time = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
        } else {
          console.warn("Invalid time values:", time);
          time = "";
        }
      } else {
        console.warn("Unexpected time format:", time);
        time = "";
      }
    }

    const location = newEventLocation || "TBD";

    if (!computedDate && time) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      computedDate = `${yyyy}-${mm}-${dd}`;
    }

  const date = computedDate || "TBD";
  // timeToSave will be stored in Firestore and shown in UI; if empty, use "TBD"
  const timeToSave = time || "TBD";

    try {
      let imageUrl: string | undefined;
      let lat: number | undefined;
      let lng: number | undefined;
      let startTimestamp: number | undefined;

      if (newEventImageFile) {
        const storageRef = ref(
          storage,
          `event_images/${user.uid}/${code}_${newEventImageFile.name}`
        );
        await uploadBytes(storageRef, newEventImageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // If we have a date (computedDate may have been set to today) and a time, compute a timestamp
      if (computedDate && time) {
        // combine into an ISO-like string (assumes local timezone)
        const dt = new Date(`${computedDate}T${time}`);
        if (!isNaN(dt.getTime())) startTimestamp = dt.getTime();
      }

      // Try to geocode the provided location string using Mapbox if token is present
      const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
      if (token && newEventLocation && newEventLocation.trim()) {
        try {
          const q = encodeURIComponent(newEventLocation.trim());
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&limit=1`
          );
          if (res.ok) {
            const data = await res.json();
            const feat = data?.features?.[0];
            if (feat && feat.center && feat.center.length >= 2) {
              lng = Number(feat.center[0]);
              lat = Number(feat.center[1]);
            }
          }
        } catch (e) {
          // ignore geocode failures — event will be created without lat/lng
          console.warn("Geocode failed", e);
        }
      }

      await createEventInDb({
        code,
        name: newEventName.trim(),
        date,
        time: timeToSave,
        location,
        createdByUid: user.uid,
        role: createRole,
        imageUrl, // can be undefined
        lat: lat ?? null,
        lng: lng ?? null,
        startTimestamp: startTimestamp ?? null,
      });
      // Read back the saved event from Firestore to ensure displayed values
      try {
        const eventRef = firestoreDoc(db, "events", code);
        const snap = await getFirestoreDoc(eventRef);
        const saved = snap.exists() ? (snap.data() as FirestoreEvent) : null;

        const newEvent: EventItem = {
          code,
          name: saved?.name || newEventName.trim(),
          date: saved?.date || date,
          time: saved?.time || timeToSave,
          location: saved?.location || location,
          joined: true,
          image: saved?.imageUrl || imageUrl || pickImageForLocation(location),
          createdByUid: saved?.createdByUid || user.uid,
          role: createRole,
        };

        setEvents((prev) => [...prev, newEvent]);
      } catch (err) {
        // fallback to local object if readback fails
        const newEvent: EventItem = {
          code,
          name: newEventName.trim(),
          date,
          time: timeToSave,
          location,
          joined: true,
          image: imageUrl || pickImageForLocation(location),
          createdByUid: user.uid,
          role: createRole,
        };
        setEvents((prev) => [...prev, newEvent]);
      }
      setGeneratedCode(code);
      setCreateError("");
      setNewEventImageFile(null);
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || "Failed to create event.");
    }
  };

  const handleDeleteEvent = async (code: string) => {
    if (!user) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this event? This cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      await deleteEventForUser(code, user.uid); // this calls Firestore

      setEvents((prev) => prev.filter((e) => e.code !== code));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete event.");
    }
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setGeneratedCode(null);
    setNewEventName("");
    setNewEventDate("");
    setNewEventTime("");
    setNewEventLocation("");
    setCreateRole("attendee");
    setNewEventImageFile(null);
    setCreateError("");
  };

  const createdByMe = user
    ? events.filter((e) => e.createdByUid === user.uid)
    : [];
  const otherEvents = user
    ? events.filter((e) => e.createdByUid !== user.uid)
    : events;

  const renderEventCard = (event: EventItem, index: number) => (
    <Box key={event.code} sx={{ flex: "1 1 360px", maxWidth: 480 }}>
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
          backgroundImage: `url(${event.image || pickImageForLocation(event.location)})`,
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

        <CardContent sx={{ position: "relative", px: 3, py: 2.5 }}>
          <Typography variant="h6" gutterBottom>
            <b>{event.name}</b>
          </Typography>

          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarMonthIcon fontSize="small" />
              <Typography variant="body2">{event.date}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTimeIcon fontSize="small" />
              <Typography variant="body2">{formatTimeDisplay(event.time)}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <PlaceIcon fontSize="small" />
              <Typography variant="body2">{event.location}</Typography>
            </Stack>

            <Typography
              variant="body2"
              sx={{ mt: 0.5, opacity: 0.85 }}
            >
              Code: {event.code}
            </Typography>

            {event.role && (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Your role:{" "}
                {event.role === "recruiter" ? "Recruiter" : "Attendee"}
              </Typography>
            )}
          </Stack>
        </CardContent>

        <CardActions sx={{ position: "relative", px: 3, pb: 2 }}>
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

          {user && event.createdByUid === user.uid && (
            <Button
              size="small"
              color="error"
              sx={{ ml: "auto", color: "error.light" }}
              onClick={() => handleDeleteEvent(event.code)}
            >
              Delete
            </Button>
          )}
        </CardActions>
      </Card>
    </Box>
  );

  function formatTimeDisplay(t: string) {
    if (!t || t === "TBD") return "TBD";
    // expect HH:MM in 24-hour
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return t;
    let hh = Number(m[1]);
    const mm = m[2];
    const period = hh >= 12 ? "PM" : "AM";
    hh = hh % 12;
    if (hh === 0) hh = 12;
    return `${hh}:${mm} ${period}`;
  }

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
      <BackButton />
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
                Create events, join events, see who’s nearby, and manage your
                profile.
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
              <Button color="secondary" variant="contained" component={Link} to="/map">
                Search for nearby events
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setJoinOpen(true);
                  setJoinError("");
                  setEventCode("");
                }}
              >
                Join Event
              </Button>
            </Stack>
          </Stack>

          {/* Events section */}
          <Stack spacing={3}>
            {loadingEvents && (
              <Typography variant="body2" color="text.secondary">
                Loading your events…
              </Typography>
            )}

            {createdByMe.length > 0 && (
              <>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{ animation: `${fadeUp} 0.8s ease-out` }}
                >
                  Events you created
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 3,
                  }}
                >
                  {createdByMe.map((e, i) => renderEventCard(e, i))}
                </Box>
              </>
            )}

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
              {events.length === 0 && !loadingEvents && (
                <Typography variant="body2" color="text.secondary">
                  You haven’t joined any events yet. Use “Join Event” or create
                  one with the + button.
                </Typography>
              )}
              {otherEvents.map((e, i) => renderEventCard(e, i))}
            </Box>
          </Stack>
        </Stack>
      </Container>

      {/* Floating Create Event button */}
      <Fab
        color="primary"
        aria-label="create-event"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          animation: `${float} 3s ease-in-out infinite`,
        }}
        onClick={() => {
          setCreateOpen(true);
          setGeneratedCode(null);
        }}
      >
        <AddIcon />
      </Fab>

      {/* JOIN EVENT dialog */}
      <Dialog
        open={joinOpen}
        onClose={() => {
          setJoinOpen(false);
          setJoinError("");
          setEventCode("");
        }}
      >
        <DialogTitle>Join Event</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Event Code"
              fullWidth
              variant="outlined"
              value={eventCode}
              onChange={(e) => {
                setEventCode(e.target.value.toUpperCase());
                setJoinError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleJoinEvent();
                }
              }}
            />

            <FormControl component="fieldset">
              <FormLabel component="legend">I am attending as</FormLabel>
              <RadioGroup
                row
                value={joinRole}
                onChange={(e) =>
                  setJoinRole(e.target.value as Role)
                }
              >
                <FormControlLabel
                  value="attendee"
                  control={<Radio />}
                  label="Attendee"
                />
                <FormControlLabel
                  value="recruiter"
                  control={<Radio />}
                  label="Recruiter"
                />
              </RadioGroup>
            </FormControl>

            {joinError && (
              <Typography color="error" variant="body2">
                {joinError}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setJoinOpen(false);
              setJoinError("");
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

      {/* CREATE EVENT dialog */}
      <Dialog open={createOpen} onClose={handleCloseCreate}>
        <DialogTitle>Create Event</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Event Name"
              fullWidth
              variant="outlined"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
            />
            <TextField
              label="Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
            />
            <TextField
              label="Time"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newEventTime}
              onChange={(e) => setNewEventTime(e.target.value)}
            />
            <TextField
              label="Location"
              fullWidth
              variant="outlined"
              value={newEventLocation}
              onChange={(e) => setNewEventLocation(e.target.value)}
            />

            <Button
              variant="outlined"
              component="label"
              sx={{ alignSelf: "flex-start", mt: 1 }}
            >
              Upload event image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setNewEventImageFile(file);
                }}
              />
            </Button>
            {newEventImageFile && (
              <Typography variant="caption" sx={{ mt: 0.5 }}>
                Selected: {newEventImageFile.name}
              </Typography>
            )}

            <FormControl component="fieldset">
              <FormLabel component="legend">I am attending as</FormLabel>
              <RadioGroup
                row
                value={createRole}
                onChange={(e) =>
                  setCreateRole(e.target.value as Role)
                }
              >
                <FormControlLabel
                  value="attendee"
                  control={<Radio />}
                  label="Attendee"
                />
                <FormControlLabel
                  value="recruiter"
                  control={<Radio />}
                  label="Recruiter"
                />
              </RadioGroup>
            </FormControl>

            {generatedCode && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Event created! Your event code is <b>{generatedCode}</b>.
              </Typography>
            )}

            {createError && (
              <Typography color="error" variant="body2">
                {createError}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate}>Close</Button>
          <Button onClick={handleCreateEvent} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
