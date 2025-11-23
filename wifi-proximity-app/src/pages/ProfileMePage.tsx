import { useEffect, useState, useContext } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Button,
  Avatar,
} from "@mui/material";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getProfileByUid } from "../services/profileService";
import defaultAvatar from "../assets/defaultAvatar.png";

export function ProfileMePage() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const p = await getProfileByUid(user.uid);
        if (!mounted) return;
        setProfile(p);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  const fullName =
    (profile?.firstName || "") + (profile?.lastName ? ` ${profile.lastName}` : "");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: 6 }}>
          <Stack spacing={2} alignItems="center">
            <Avatar
              src={profile?.photoURL || defaultAvatar}
              sx={{
                width: 120,
                height: 120,
                boxShadow: 4,
                border: "3px solid white",
              }}
            />
            <Typography variant="h5">
              {fullName || "(Name not set)"}
            </Typography>

            {loading ? (
              <Typography>Loading…</Typography>
            ) : (
              <>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  align="center"
                >
                  Bio
                </Typography>
                <Typography align="center">
                  {profile?.bio || "(bio not set yet)"}
                </Typography>

                <Typography variant="body2" align="center">
                  <strong>Interests:</strong>{" "}
                  {Array.isArray(profile?.interests)
                    ? profile.interests.join(", ")
                    : profile?.interests || "(not set)"}
                </Typography>
              </>
            )}

            <Button
              variant="contained"
              component={Link}
              to="/profile/edit"
              sx={{ mt: 2 }}
            >
              Edit Profile
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
