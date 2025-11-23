// src/pages/NearbyPage.tsx
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

interface NearbyUser {
  deviceId: string;
  profileSlug: string;
  latency?: number;
  timestamp?: number;
}

const PROXIMITY_LATENCY_MS = 50; // ~3 feet over WiFi
const PROXIMITY_RADIUS_FEET = 3;

export function NearbyPage() {
  const { eventCode } = useParams();
  const { user } = useContext(AuthContext);
  const [deviceId] = useState(() => {
    try {
      // prefer modern API, fall back to a simple RFC4122-like generator if missing
      if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
        return (crypto as any).randomUUID();
      }
    } catch (err) {
      console.warn("crypto.randomUUID not available, falling back:", err);
    }

    // fallback UUID v4 generator (not cryptographically strong but fine for client ids)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  });
  const [myProfileSlug, setMyProfileSlug] = useState<string>("");
  const [others, setOthers] = useState<NearbyUser[]>([]);
  const [measuring, setMeasuring] = useState(false);
  const [autoOpenEnabled, setAutoOpenEnabled] = useState(true);

  const autoOpenRef = useRef(true);
  const openedProfilesRef = useRef<Set<string>>(new Set());
  const navigate = useNavigate();

  // Keep ref in sync with state
  useEffect(() => {
    autoOpenRef.current = autoOpenEnabled;
  }, [autoOpenEnabled]);

  // Load my profile slug
  useEffect(() => {
    if (user) {
      getProfileByUid(user.uid).then((profile) => {
        if (profile?.slug) {
          setMyProfileSlug(profile.slug);
        }
      });
    }
  }, [user]);

  // Measure latency to another device
  const measureLatency = useCallback(
    async (targetDeviceId: string): Promise<number> => {
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

        // Timeout after 1s
        setTimeout(() => resolve(9999), 1000);
      });
    },
    [deviceId]
  );

  // Open profile if the other user is close enough
  const openProfileIfClose = useCallback(
    async (
      otherUser: NearbyUser,
      options: {
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
      } = options;

      const latency =
        latencyOverride !== undefined
          ? latencyOverride
          : await measureLatency(otherUser.deviceId);

      const withinRange = latency < PROXIMITY_LATENCY_MS;
      if (!withinRange) return;

      if (!ignoreAutoOpenGate && !autoOpenRef.current) return;
      if (!allowRepeat && openedProfilesRef.current.has(otherUser.deviceId))
        return;

      openedProfilesRef.current.add(otherUser.deviceId);

      await saveInteraction({
        ownerUserId: user.uid,
        otherUserId: otherUser.profileSlug,
        eventCode: eventCode,
        note: `Auto-detected via WiFi proximity (${latency}ms latency)`,
      });

      navigate(
        `/profile/view/${otherUser.profileSlug}?eventCode=${eventCode}&back=nearby`
      );
    },
    [eventCode, measureLatency, navigate, user]
  );

  // Socket wiring
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

      const incomingUser: NearbyUser = {
        deviceId: data.deviceId,
        profileSlug: data.profileSlug,
        latency,
        timestamp: receivedAt,
      };

      // Auto-open if close enough
      if (latency < PROXIMITY_LATENCY_MS) {
        void openProfileIfClose(incomingUser, { latencyOverride: latency });
      }

      setOthers((prev) => {
        const existing = prev.find((o) => o.deviceId === data.deviceId);
        if (existing) {
          return prev.map((o) =>
            o.deviceId === data.deviceId
              ? { ...o, latency, timestamp: receivedAt }
              : o
          );
        }
        return [...prev, incomingUser];
      });
    });

    socket.on("ping", (data: any) => {
      if (data.targetDeviceId === deviceId) {
        socket.emit("pong", {
          fromDeviceId: deviceId,
          toDeviceId: data.deviceId,
        });
      }
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
      socket.off("ping");
      socket.off("pong");
      socket.off("incomingProfile");
    };
  }, [deviceId, eventCode, myProfileSlug, navigate, openProfileIfClose]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 8,
        display: "flex",
        alignItems: "center",
        bgcolor: "background.default",
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          animation: `${fadeUp} 0.6s ease-out`,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Nearby people at {eventCode}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Anyone on the same WiFi with this page open and event code selected
          will appear here.
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mt: 1, animation: `${slideLeft} 0.5s ease-out` }}
        >
          <Chip
            size="small"
            color="primary"
            label={`Latency filter < ${PROXIMITY_LATENCY_MS}ms (~${PROXIMITY_RADIUS_FEET}ft)`}
          />
          <Typography variant="caption" color="text.secondary">
            Auto pop-up {autoOpenEnabled ? "on" : "paused"} via +
          </Typography>
        </Stack>

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
            const isNearby =
              o.latency !== undefined &&
              o.latency < PROXIMITY_LATENCY_MS;

            return (
              <Card
                key={o.deviceId}
                sx={{
                  bgcolor: isNearby ? "#e8f5e9" : "white",
                  animation: `${fadeUp} 0.45s ease-out`,
                }}
              >
                <CardContent>
                  <Typography variant="subtitle1">
                    Someone nearby
                    {isNearby && " 🎯"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {o.latency !== undefined
                      ? `Latency: ${o.latency}ms ${
                          isNearby ? "(< 3 feet!)" : ""
                        }`
                      : "Measuring distance..."}
                  </Typography>
                  {isNearby && (
                    <Typography
                      variant="caption"
                      color="success.main"
                      sx={{ mt: 1, display: "block" }}
                    >
                      ✅ In proximity range – profile auto-opens when + is on
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
                        setOthers((prev) =>
                          prev.map((entry) =>
                            entry.deviceId === o.deviceId
                              ? { ...entry, latency }
                              : entry
                          )
                        );
                        void openProfileIfClose(o, {
                          latencyOverride: latency,
                          ignoreAutoOpenGate: true,
                          allowRepeat: true,
                        });
                      });
                    }}
                    disabled={measuring}
                  >
                    {measuring
                      ? "Checking..."
                      : isNearby
                      ? "View Profile"
                      : "Check Distance"}
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

      <Tooltip
        title={
          autoOpenEnabled
            ? `Auto pop-up on (<${PROXIMITY_RADIUS_FEET}ft)`
            : "Enable auto pop-up when <3ft"
        }
      >
        <Fab
          color={autoOpenEnabled ? "success" : "default"}
          aria-label="toggle-latency-filter"
          onClick={() => setAutoOpenEnabled((v) => !v)}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            animation: `${float} 3s ease-in-out infinite`,
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}
