// src/pages/NearbyPage.tsx
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProximitySocket } from "../services/proximityService";
import { AuthContext } from "../context/AuthContext";
import { getProfileByUid } from "../services/profileService";
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
import { fadeUp, slideLeft } from "../styles/animations";
import { BackButton } from "../components/BackButton";

interface NearbyUser {
  deviceId: string;
  profileSlug: string;
  userId: string;
  name?: string;
  latency?: number;
  timestamp?: number;
}

const PROXIMITY_LATENCY_MS = 250; // treat <~250ms as "nearby"
const PROXIMITY_RADIUS_FEET = 1;  // just an approximate label

export function NearbyPage() {
  const { eventCode } = useParams<{ eventCode: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // stable per-user ID (so reloading the page doesn’t create “new devices”)
  const [deviceId] = useState(() => {
    if (user?.uid) return `uid-${user.uid}`;
    return "anon-" + Math.random().toString(36).slice(2);
  });

  const [myProfileSlug, setMyProfileSlug] = useState<string>("");
  const [others, setOthers] = useState<NearbyUser[]>([]);
  const [eventName, setEventName] = useState<string>("");

  // load my profile slug
  useEffect(() => {
    if (user) {
      getProfileByUid(user.uid).then((p) => {
        if (p?.slug) setMyProfileSlug(p.slug);
      });
    }
  }, [user]);

  // load event name
  useEffect(() => {
    if (eventCode) {
      getEventByCode(eventCode).then((event) => {
        if (event?.name) setEventName(event.name);
      });
    }
  }, [eventCode]);

  // socket listeners
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

    // receive presence from others
    socket.on("presence", (data: any) => {
      if (data.deviceId === deviceId) return;

      const receivedAt = Date.now();
      const latency = receivedAt - (data.timestamp || receivedAt);

      const incoming: NearbyUser = {
        deviceId: data.deviceId,
        profileSlug: data.profileSlug,
        userId: data.userId,
        latency,
        timestamp: receivedAt,
      };

      setOthers((prev) => {
        const existing = prev.find(
          (o) => o.profileSlug === data.profileSlug
        );

        if (existing) {
          return prev.map((o) =>
            o.profileSlug === data.profileSlug
              ? {
                ...o,
                deviceId: data.deviceId,
                latency,
                timestamp: receivedAt,
              }
              : o
          );
        }

        return [...prev, incoming];
      });

      // look up their display name once we see them
      if (data.userId) {
        getProfileByUid(data.userId).then((p) => {
          if (p?.name) {
            setOthers((prev) =>
              prev.map((o) =>
                o.userId === data.userId ? { ...o, name: p.name } : o
              )
            );
          }
        });
      }
    });

    // respond to latencyPing (for other clients that still measure distance)
    socket.on("latencyPing", (data: any) => {
      if (data.toDeviceId !== deviceId) return;
      socket.emit("latencyPong", {
        fromDeviceId: deviceId,
        toDeviceId: data.fromDeviceId,
      });
    });

    return () => {
      clearInterval(interval);
      socket.off("presence");
      socket.off("latencyPing");
    };
  }, [deviceId, eventCode, myProfileSlug, user]);

  // UI
  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 10,
        pb: 4,
        display: "flex",
        alignItems: "center",
        bgcolor: "background.default",
      }}
    >
      <BackButton
        onClick={() => {
          navigate("/dashboard", { replace: true });
        }}
      />

      <Container
        maxWidth="md"
        sx={{
          animation: `${fadeUp} 0.6s ease-out`,
        }}
      >
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

        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ mt: 3, animation: `${slideLeft} 0.5s ease-out` }}
        >
          <Chip
            size="medium"
            color="primary"
            label={`Latency < ${PROXIMITY_LATENCY_MS}ms`}
            sx={{ fontSize: "1rem", px: 1.5, py: 2.5 }}
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
              o.latency !== undefined &&
              o.latency < PROXIMITY_LATENCY_MS;

            return (
              <Card
                key={o.deviceId}
                sx={{
                  bgcolor: isNearby ? "#e8f5e9" : "white",
                  animation: `${fadeUp} 0.45s ease-out`,
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.5 }}>
                    {o.name || "Someone nearby"} {isNearby && "🎯"}
                  </Typography>

                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ fontWeight: 400 }}
                  >
                    {o.latency !== undefined
                      ? `Latency: ${o.latency}ms`
                      : "Measuring distance..."}
                  </Typography>

                  {isNearby && (
                    <Typography
                      variant="body1"
                      color="success.main"
                      sx={{ mt: 2, display: "block", fontWeight: 500 }}
                    >
                      ✅ In proximity
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    size="large"
                    variant="contained"
                    color="success"
                    sx={{ minWidth: 160, fontSize: "1rem" }}
                    onClick={() => {
                      if (!o.profileSlug) {
                        alert(
                          "This person hasn't set up a public profile yet."
                        );
                        return;
                      }

                      // log the interaction (optional but nice)
                      if (user && eventCode && o.userId) {
                        void saveInteraction({
                          ownerUserId: user.uid,
                          otherUserId: o.userId,
                          eventCode,
                          note: "Viewed via WiFi proximity",
                        });
                      }

                      navigate(
                        `/profile/view/${o.profileSlug}?eventCode=${eventCode}&eventName=${encodeURIComponent(
                          eventName || ""
                        )}&back=nearby`
                      );
                    }}
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
