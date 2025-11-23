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
} from "@mui/material";
import { saveInteraction } from "../services/eventService";

interface NearbyUser {
  deviceId: string;
  profileSlug: string;
  latency?: number;
  timestamp?: number;
}

const LATENCY_THRESHOLD = 50; // ~3 feet in milliseconds (WiFi latency)

export function NearbyPage() {
  const { eventCode } = useParams();
  const { user } = useContext(AuthContext);
  const [deviceId] = useState(() => crypto.randomUUID());
  const [myProfileSlug, setMyProfileSlug] = useState<string>("");
  const [others, setOthers] = useState<NearbyUser[]>([]);
  const [measuring, setMeasuring] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      getProfileByUid(user.uid).then((profile) => {
        if (profile?.slug) {
          setMyProfileSlug(profile.slug);
        }
      });
    }
  }, [user]);

  // Measure latency to other devices
  const measureLatency = async (targetDeviceId: string): Promise<number> => {
    return new Promise((resolve) => {
      const socket = getProximitySocket();
      const pingStart = Date.now();

      socket.emit("ping", { targetDeviceId, deviceId });

      socket.once("pong", (data: any) => {
        if (data.fromDeviceId === targetDeviceId) {
          const latency = Date.now() - pingStart;
          resolve(latency);
        }
      });

      // Timeout after 1 second
      setTimeout(() => resolve(9999), 1000);
    });
  };

  // Auto-navigate to profile if within proximity
  const handleProximityDetection = async (otherUser: NearbyUser) => {
    if (!user || !eventCode) return;

    const latency = await measureLatency(otherUser.deviceId);

    if (latency < LATENCY_THRESHOLD) {
      // Save interaction
      await saveInteraction({
        ownerUserId: user.uid,
        otherUserId: otherUser.profileSlug,
        eventCode: eventCode,
        note: `Auto-detected via WiFi proximity (${latency}ms latency)`,
      });

      // Navigate to their profile
      navigate(`/profile/view/${otherUser.profileSlug}?eventCode=${eventCode}&back=nearby`);
    }
  };

  useEffect(() => {
    if (!eventCode || !myProfileSlug) return;
    const socket = getProximitySocket();

    const sendPresence = () => {
      socket.emit("presence", {
        eventCode,
        deviceId,
        profileSlug: myProfileSlug,
        timestamp: Date.now(),
      });
    };

    sendPresence();
    const interval = setInterval(sendPresence, 1500);

    socket.on("presence", (data: any) => {
      if (data.deviceId === deviceId) return;

      const receivedAt = Date.now();
      const latency = receivedAt - (data.timestamp || receivedAt);

      setOthers((prev) => {
        const existing = prev.find((o) => o.deviceId === data.deviceId);
        if (existing) {
          return prev.map((o) =>
            o.deviceId === data.deviceId ? { ...o, latency, timestamp: receivedAt } : o
          );
        }

        const newUser: NearbyUser = {
          deviceId: data.deviceId,
          profileSlug: data.profileSlug,
          latency,
          timestamp: receivedAt,
        };

        // Auto-detect proximity for new users
        if (latency < LATENCY_THRESHOLD) {
          handleProximityDetection(newUser);
        }

        return [...prev, newUser];
      });
    });

    socket.on("ping", (data: any) => {
      if (data.targetDeviceId === deviceId) {
        socket.emit("pong", { fromDeviceId: deviceId, toDeviceId: data.deviceId });
      }
    });

    socket.on("incomingProfile", (data: any) => {
      if (data.toDeviceId === deviceId) {
        navigate(`/profile/view/${data.profileSlug}?eventCode=${eventCode}&back=nearby`);
      }
    });

    return () => {
      clearInterval(interval);
      socket.off("presence");
      socket.off("ping");
      socket.off("pong");
      socket.off("incomingProfile");
    };
  }, [deviceId, eventCode, myProfileSlug, navigate, user]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 8,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Typography variant="h5" gutterBottom>
          Nearby people at {eventCode}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Anyone on the same WiFi with this page open and event code selected
          will appear here.
        </Typography>

        {others.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Waiting for other devices…
          </Typography>
        )}

        <Stack spacing={2} sx={{ mt: 2 }}>
          {others.map((o) => {
            const isNearby = o.latency && o.latency < LATENCY_THRESHOLD;
            return (
              <Card key={o.deviceId} sx={{ bgcolor: isNearby ? "#e8f5e9" : "white" }}>
                <CardContent>
                  <Typography variant="subtitle1">
                    Someone nearby
                    {isNearby && " 🎯"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {o.latency !== undefined
                      ? `Latency: ${o.latency}ms ${isNearby ? "(< 3 feet!)" : ""}`
                      : "Measuring distance..."}
                  </Typography>
                  {isNearby && (
                    <Typography variant="caption" color="success.main" sx={{ mt: 1, display: "block" }}>
                      ✅ In proximity range - Profile will auto-open!
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant={isNearby ? "contained" : "outlined"}
                    color={isNearby ? "success" : "primary"}
                    onClick={() => {
                      if (measuring) return;
                      setMeasuring(true);
                      measureLatency(o.deviceId).then((latency) => {
                        setMeasuring(false);
                        if (latency < LATENCY_THRESHOLD) {
                          handleProximityDetection(o);
                        }
                      });
                    }}
                    disabled={measuring}
                  >
                    {measuring ? "Checking..." : isNearby ? "View Profile" : "Check Distance"}
                  </Button>
                  <Button
                    size="small"
                    onClick={() =>
                      getProximitySocket().emit("shareProfile", {
                        toDeviceId: o.deviceId,
                        profileSlug: myProfileSlug,
                      })
                    }
                  >
                    Share
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
