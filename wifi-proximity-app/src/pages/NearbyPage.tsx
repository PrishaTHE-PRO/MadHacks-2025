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

export function NearbyPage() {
  const { eventCode } = useParams();
  const { user } = useContext(AuthContext);
  const [deviceId] = useState(() => crypto.randomUUID());
  const [myProfileSlug, setMyProfileSlug] = useState<string>("");
  const [others, setOthers] = useState<
    { deviceId: string; profileSlug: string }[]
  >([]);
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

  useEffect(() => {
    if (!eventCode) return;
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
      setOthers((prev) =>
        prev.some((o) => o.deviceId === data.deviceId)
          ? prev
          : [
              ...prev,
              { deviceId: data.deviceId, profileSlug: data.profileSlug },
            ]
      );
    });

    socket.on("incomingProfile", (data: any) => {
      if (data.toDeviceId === deviceId) {
        navigate(`/p/${data.profileSlug}`);
      }
    });

    return () => {
      clearInterval(interval);
      socket.off("presence");
      socket.off("incomingProfile");
    };
  }, [deviceId, eventCode, myProfileSlug, navigate]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Waiting for other devices…
          </Typography>
        )}

        <Stack spacing={2} sx={{ mt: 2 }}>
          {others.map((o) => (
            <Card key={o.deviceId}>
              <CardContent>
                <Typography variant="subtitle1">
                  Someone nearby
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tap to send them your profile
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
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
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
