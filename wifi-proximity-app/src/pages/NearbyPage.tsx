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
import { saveInteraction, getEventByCode } from "../services/eventService";
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
  const [measuring, setMeasuring] = useState(false);
  const [autoOpenEnabled, setAutoOpenEnabled] = useState(true);
  const [eventName, setEventName] = useState<string>("");

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

  // load event name
  useEffect(() => {
    if (eventCode) {
      getEventByCode(eventCode).then((event) => {
        if (event?.name) setEventName(event.name);
      });
    }
  }, [eventCode]);

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

      // ✅ match saveInteraction({ ownerUserId, otherUserId, eventCode, note? })
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

    // respond to latencyPing from server (relayed from other client)
    socket.on("latencyPing", (data: any) => {
      // server sends: { fromDeviceId, toDeviceId }
      if (data.toDeviceId !== deviceId) return;

      socket.emit("latencyPong", {
        fromDeviceId: deviceId,
        toDeviceId: data.fromDeviceId,
      });
    });

    // handle direct profile share
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
  }, [deviceId, eventCode, myProfileSlug, navigate, openProfileIfClose, user]);

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
          try {
            // Prefer going back in history to preserve user's flow
            if (window.history && window.history.length > 1) {
              navigate(-1);
            } else {
              // Fallback: replace so we don't push a duplicate entry and cause a loop
              navigate(`/events/${eventCode}`, { replace: true });
            }
          } catch {
            navigate(`/events/${eventCode}`, { replace: true });
          }
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
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 400 }}>
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
            label={`Latency < ${PROXIMITY_LATENCY_MS}ms (~${PROXIMITY_RADIUS_FEET}ft)`}
            sx={{ fontSize: "1rem", px: 1.5, py: 2.5 }}
          />
          <Typography variant="body1" color="text.secondary">
            Auto pop-up {autoOpenEnabled ? "ON" : "OFF"} (via +)
          </Typography>
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
                    Someone nearby {isNearby && "🎯"}
                  </Typography>

                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                    {o.latency !== undefined
                      ? `Latency: ${o.latency}ms ${isNearby ? "(< 3 feet!)" : ""
                      }`
                      : "Measuring distance..."}
                  </Typography>

                  {isNearby && (
                    <Typography
                      variant="body1"
                      color="success.main"
                      sx={{ mt: 2, display: "block", fontWeight: 500 }}
                    >
                      ✅ In proximity — will auto-open when + is ON
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    size="large"
                    variant={isNearby ? "contained" : "outlined"}
                    color={isNearby ? "success" : "primary"}
                    disabled={measuring}
                    sx={{ minWidth: 160, fontSize: "1rem" }}
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
                    size="large"
                    sx={{ minWidth: 100, fontSize: "1rem" }}
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
            bottom: 32,
            right: 32,
            width: 72,
            height: 72,
            animation: `${float} 3s ease-in-out infinite`,
          }}
        >
          <AddIcon sx={{ fontSize: 36 }} />
        </Fab>
      </Tooltip>
    </Box>
  );
}
