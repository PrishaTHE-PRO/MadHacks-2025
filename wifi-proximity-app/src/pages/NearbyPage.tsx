import {
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
} from "react";
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
  Fab,
  Tooltip,
} from "@mui/material";
import { saveInteraction } from "../services/eventService";
import AddIcon from "@mui/icons-material/Add";
import { fadeUp, float, slideLeft } from "../styles/animations";
import { BackButton } from "../components/BackButton";

// ----------------------
// NearbyPage Constants
// ----------------------
interface NearbyUser {
  deviceId: string;
  profileSlug: string;
  userId: string;
  latency?: number;
  timestamp?: number;
}

const PROXIMITY_LATENCY_MS = 250;
const PROXIMITY_RADIUS_FEET = 1;

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
  const [measuring, setMeasuring] = useState(false);
  const [autoOpenEnabled, setAutoOpenEnabled] = useState(true);

  const autoOpenRef = useRef(true);
  const openedProfilesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    autoOpenRef.current = autoOpenEnabled;
  }, [autoOpenEnabled]);

  // ----------------------
  // Load my profile slug
  // ----------------------
  useEffect(() => {
    if (user) {
      getProfileByUid(user.uid).then((p) => {
        if (p?.slug) setMyProfileSlug(p.slug);
      });
    }
  }, [user]);

  // ----------------------
  // Latency Ping/Pong
  // ----------------------
  const measureLatency = useCallback(
    async (targetDeviceId: string): Promise<number> => {
      return new Promise((resolve) => {
        const socket = getProximitySocket();
        const pingStart = Date.now();

        const handler = (data: any) => {
          if (
            data.fromDeviceId === targetDeviceId &&
            data.toDeviceId === deviceId
          ) {
            const latency = Date.now() - pingStart;
            socket.off("latencyPong", handler);
            resolve(latency);
          }
        };

        socket.on("latencyPong", handler);
        socket.emit("latencyPing", { targetDeviceId, deviceId });

        setTimeout(() => {
          socket.off("latencyPong", handler);
          resolve(9999);
        }, 1000);
      });
    },
    [deviceId]
  );

  // ----------------------
  // Auto-open if in range
  // ----------------------
  const openProfileIfClose = useCallback(
    async (
      otherUser: NearbyUser,
      opts: {
        latencyOverride?: number;
        ignoreAutoOpenGate?: boolean;
        allowRepeat?: boolean;
      } = {}
    ) => {
      if (!user || !eventCode) return;

      const {
        latencyOverride,
        ignoreAutoOpenGate = false,
        allowRepeat = false,
      } = opts;

      const latency =
        latencyOverride !== undefined
          ? latencyOverride
          : await measureLatency(otherUser.deviceId);

      if (latency >= PROXIMITY_LATENCY_MS) return;
      if (!ignoreAutoOpenGate && !autoOpenRef.current) return;
      if (!allowRepeat && openedProfilesRef.current.has(otherUser.deviceId))
        return;

      openedProfilesRef.current.add(otherUser.deviceId);

      if (!otherUser.profileSlug) return;

      await saveInteraction({
        ownerUserId: user.uid,
        otherUserId: otherUser.profileSlug,
        eventCode,
        note: `Auto-detected via WiFi proximity (${latency}ms)`,
      });

      navigate(
        `/profile/view/${otherUser.profileSlug}?eventCode=${eventCode}&back=nearby`
      );
    },
    [user, eventCode, measureLatency, navigate]
  );

  // ----------------------
  // Socket Setup
  // ----------------------
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

    socket.on("presence", (data: any) => {
      if (data.deviceId === deviceId) return;

      const now = Date.now();
      const latency = now - (data.timestamp || now);

      const incoming: NearbyUser = {
        deviceId: data.deviceId,
        profileSlug: data.profileSlug,
        userId: data.userId,
        latency,
        timestamp: now,
      };

      if (latency < PROXIMITY_LATENCY_MS) {
        void openProfileIfClose(incoming, { latencyOverride: latency });
      }

      setOthers((prev) => {
        const exists = prev.find((p) => p.deviceId === data.deviceId);
        if (exists) {
          return prev.map((p) =>
            p.deviceId === data.deviceId ? incoming : p
          );
        }
        return [...prev, incoming];
      });
    });

    socket.on("latencyPing", (data: any) => {
      if (data.toDeviceId !== deviceId) return;
      socket.emit("latencyPong", {
        fromDeviceId: deviceId,
        toDeviceId: data.fromDeviceId,
      });
    });

    socket.on("incomingProfile", (data: any) => {
      if (data.toDeviceId === deviceId) {
        navigate(
          `/profile/view/${data.profileSlug}?eventCode=${eventCode}&back=nearby`
        );
      }
    });

    return () => {
      clearInterval(interval);
      socket.off("presence");
      socket.off("latencyPing");
      socket.off("incomingProfile");
    };
  }, [
    deviceId,
    eventCode,
    myProfileSlug,
    navigate,
    openProfileIfClose,
    user,
  ]);

  // ----------------------
  // UI
  // ----------------------
  return (
    <Box sx={{ minHeight: "100vh", pt: 10, pb: 4 }}>
      <BackButton onClick={() => navigate(`/events/${eventCode}`)} />

      <Container maxWidth="md" sx={{ animation: `${fadeUp} 0.6s ease-out` }}>
        <Typography variant="h3" gutterBottom>
          Nearby people at {eventCode}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Chip
            size="medium"
            color="primary"
            label={`Latency < ${PROXIMITY_LATENCY_MS}ms (~${PROXIMITY_RADIUS_FEET}ft)`}
          />
          <Typography>
            Auto pop-up {autoOpenEnabled ? "ON" : "OFF"}
          </Typography>
        </Stack>

        <Stack spacing={3} sx={{ mt: 4 }}>
          {others.map((o) => {
            const isNearby = o.latency && o.latency < PROXIMITY_LATENCY_MS;

            return (
              <Card key={o.deviceId}>
                <CardContent>
                  <Typography variant="h5">
                    Someone nearby {isNearby && "🎯"}
                  </Typography>
                  <Typography variant="body1">
                    Latency: {o.latency ?? "…"}ms
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    variant={isNearby ? "contained" : "outlined"}
                    onClick={() => {
                      setMeasuring(true);
                      measureLatency(o.deviceId).then((latency) => {
                        setMeasuring(false);

                        setOthers((prev) =>
                          prev.map((x) =>
                            x.deviceId === o.deviceId ? { ...x, latency } : x
                          )
                        );

                        void openProfileIfClose(o, {
                          latencyOverride: latency,
                          ignoreAutoOpenGate: true,
                          allowRepeat: true,
                        });
                      });
                    }}
                  >
                    {isNearby ? "View Profile" : "Check Distance"}
                  </Button>

                  <Button
                    onClick={() => {
                      if (!myProfileSlug) {
                        alert("Set your profile first.");
                        return;
                      }

                      getProximitySocket().emit("shareProfile", {
                        toDeviceId: o.deviceId,
                        profileSlug: myProfileSlug,
                      });
                    }}
                  >
                    Share
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Stack>
      </Container>

      <Tooltip
        title={
          autoOpenEnabled
            ? "Auto pop-up is ON"
            : "Enable auto pop-up"
        }
      >
        <Fab
          color={autoOpenEnabled ? "success" : "default"}
          onClick={() => setAutoOpenEnabled((v) => !v)}
          sx={{
            position: "fixed",
            bottom: 32,
            right: 32,
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}
