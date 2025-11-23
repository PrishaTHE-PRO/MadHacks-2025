// src/pages/NearbyPage.tsx
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProximitySocket } from "../services/proximityService";
import { AuthContext } from "../context/AuthContext";
import { getProfileByUid, getProfileByIdOrSlug } from "../services/profileService";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import { saveInteraction, getEventByCode } from "../services/eventService";
import { fadeUp } from "../styles/animations";
import { BackButton } from "../components/BackButton";

interface NearbyUser {
  deviceId: string;
  profileSlug: string;
  userId: string;
  name?: string;
  latency?: number;
  timestamp?: number;
}

const PROXIMITY_LATENCY_MS = 250;

export function NearbyPage() {
  const { eventCode } = useParams<{ eventCode: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [deviceId] = useState(() => {
    if (user?.uid) return `uid-${user.uid}`;
    return "anon-" + Math.random().toString(36).slice(2);
  });

  const [myProfileSlug, setMyProfileSlug] = useState<string>("");
  const [others, setOthers] = useState<NearbyUser[]>([]);
  const [eventName, setEventName] = useState<string>("");

  // Load my profile slug
  useEffect(() => {
    if (user) {
      getProfileByUid(user.uid).then((p) => {
        if (p?.slug) setMyProfileSlug(p.slug);
      });
    }
  }, [user]);

  // Load event name
  useEffect(() => {
    if (!eventCode) return;
    getEventByCode(eventCode).then((evt) => {
      if (evt?.name) setEventName(evt.name);
    });
  }, [eventCode]);

  // When user clicks "View Profile"
  async function handleViewProfile(otherUser: NearbyUser) {
    if (!user || !eventCode || !otherUser.profileSlug) return;

    // log interaction
    await saveInteraction({
      ownerUserId: user.uid,
      otherUserId: otherUser.userId,
      eventCode,
      note: "Met via WiFi proximity",
    });

    navigate(
      `/profile/view/${otherUser.profileSlug}?eventCode=${eventCode}&back=nearby`
    );
  }

  // Socket setup
  useEffect(() => {
    if (!eventCode || !user) return;

    const socket = getProximitySocket();
    const profileIdentifier = myProfileSlug || user.uid || deviceId;

    const sendPresence = () => {
      socket.emit("presence", {
        eventCode,
        deviceId,
        profileSlug: profileIdentifier,
        userId: user.uid,
        timestamp: Date.now(),
      });
    };

    sendPresence();
    const interval = setInterval(sendPresence, 1500);

    socket.on("presence", async (data: any) => {
      if (data.deviceId === deviceId) return;

      const now = Date.now();
      const latency = now - (data.timestamp || now);

      let displayName: string | undefined;
      try {
        if (data.userId) {
          const p = await getProfileByIdOrSlug(data.userId);
          if (p?.name) displayName = p.name;
        }
      } catch (err) {
        console.error("Failed to load nearby user profile", err);
      }

      const incoming: NearbyUser = {
        deviceId: data.deviceId,
        profileSlug: data.profileSlug,
        userId: data.userId,
        name: displayName,
        latency,
        timestamp: now,
      };

      setOthers((prev) => {
        const idx = prev.findIndex((p) => p.deviceId === data.deviceId);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = incoming;
          return next;
        }
        return [...prev, incoming];
      });
    });

    return () => {
      clearInterval(interval);
      socket.off("presence");
    };
  }, [deviceId, eventCode, myProfileSlug, user]);

  // UI
  return (
    <Box sx={{ minHeight: "100vh", pt: 10, pb: 4 }}>
      {/* Back → dashboard */}
      <BackButton onClick={() => navigate("/dashboard")} />

      <Container maxWidth="md" sx={{ animation: `${fadeUp} 0.6s ease-out` }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Nearby people at {eventName || eventCode}
        </Typography>

        <Typography
          variant="h6"
          color="text.secondary"
          gutterBottom
          sx={{ fontWeight: 400 }}
        >
          Anyone on the same WiFi with this page open and event code selected
          will appear here.
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Chip
            size="medium"
            color="primary"
            label={`Latency < ${PROXIMITY_LATENCY_MS}ms`}
          />
        </Stack>

        {others.length === 0 && (
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mt: 4, fontWeight: 400 }}
          >
            Waiting for other devices…
          </Typography>
        )}

        <Stack spacing={3} sx={{ mt: 4 }}>
          {others.map((o) => {
            const isNearby =
              o.latency !== undefined && o.latency < PROXIMITY_LATENCY_MS;
            const displayName = o.name || "Someone nearby";

            return (
              <Card key={o.deviceId}>
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.5 }}>
                    {displayName} {isNearby && "🎯"}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {o.latency !== undefined
                      ? `Latency: ${o.latency}ms`
                      : "Measuring distance..."}
                  </Typography>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    onClick={() => handleViewProfile(o)}
                  >
                    View Profile
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
}

export default NearbyPage;