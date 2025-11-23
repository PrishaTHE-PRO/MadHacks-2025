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
import { BackButton } from "../components/BackButton";

interface NearbyUser {
  deviceId: string;
  profileSlug: string;
  userId: string;
  latency?: number;
  timestamp?: number;
}

const PROXIMITY_LATENCY_MS = 250; // treat <~250ms as "nearby"
const PROXIMITY_RADIUS_FEET = 1;  // just an approximate label

export function NearbyPage() {
  const { eventCode } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // stable per-user ID (so reloading the page doesn’t create “new devices”)
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

  // keep ref in sync
  useEffect(() => {
    autoOpenRef.current = autoOpenEnabled;
  }, [autoOpenEnabled]);

  // load my profile slug
  useEffect(() => {
    if (user) {
      getProfileByUid(user.uid).then((p) => {
        if (p?.slug) setMyProfileSlug(p.slug);
      });
    }
  }, [user]);

  // latency measurement
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

  // auto profile open
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

      const withinRange = latency < PROXIMITY_LATENCY_MS;
      if (!withinRange) return;

      if (!ignoreAutoOpenGate && !autoOpenRef.current) return;
      if (!allowRepeat && openedProfilesRef.current.has(otherUser.deviceId))
        return;

      openedProfilesRef.current.add(otherUser.deviceId);
      if (!otherUser.profileSlug) {
        console.warn("No profileSlug for nearby user; skipping auto-open");
        return;
      }

      await saveInteraction({
        ownerUserId: user.uid,
        otherUserId: otherUser.userId,
        otherUserSlug: otherUser.profileSlug,
        eventCode: eventCode,
        note: `Auto-detected via WiFi proximity (${latency}ms latency)`,
      });

      navigate(
        `/profile/view/${otherUser.profileSlug}?eventCode=${eventCode}&back=nearby`
      );
    },
    [user, eventCode, measureLatency, navigate]
  );

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

      if (latency < PROXIMITY_LATENCY_MS) {
        void openProfileIfClose(incoming, { latencyOverride: latency });
      }

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
  }, [deviceId, eventCode, myProfileSlug, navigate, openProfileIfClose, user]);

  // UI
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
      <BackButton />

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
            label={`Latency < ${PROXIMITY_LATENCY_MS}ms (~${PROXIMITY_RADIUS_FEET}ft)`}
          />
          <Typography variant="caption" color="text.secondary">
            Auto pop-up {autoOpenEnabled ? "ON" : "OFF"} (via +)
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
                    Someone nearby {isNearby && "🎯"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {o.latency !== undefined
                      ? `Latency: ${o.latency}ms ${isNearby ? "(< 3 feet!)" : ""
                      }`
                      : "Measuring distance..."}
                  </Typography>

                  {isNearby && (
                    <Typography
                      variant="caption"
                      color="success.main"
                      sx={{ mt: 1, display: "block" }}
                    >
                      ✅ In proximity — will auto-open when + is ON
                    </Typography>
                  )}
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    variant={isNearby ? "contained" : "outlined"}
                    color={isNearby ? "success" : "primary"}
                    disabled={measuring}
                    onClick={() => {
                      if (measuring) return;
                      setMeasuring(true);

                      measureLatency(o.deviceId).then((latency) => {
                        setMeasuring(false);

                        setOthers((prev) =>
                          prev.map((x) =>
                            x.deviceId === o.deviceId
                              ? { ...x, latency }
                              : x
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
                    {measuring
                      ? "Checking..."
                      : isNearby
                        ? "View Profile"
                        : "Check Distance"}
                  </Button>

                  <Button
                    size="small"
                    onClick={() => {
                      if (!myProfileSlug) {
                        alert(
                          "You need to set up your profile before sharing it."
                        );
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
            ? `Auto pop-up on (<${PROXIMITY_RADIUS_FEET}ft)`
            : "Enable auto pop-up (<3ft)"
        }
      >
        <Fab
          color={autoOpenEnabled ? "success" : "default"}
          aria-label="toggle-latency"
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
