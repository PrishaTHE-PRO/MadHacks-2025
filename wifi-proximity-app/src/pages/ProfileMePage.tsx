import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getProfileByUid } from "../services/profileService";

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
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" gutterBottom>
            My Profile
          </Typography>
          <Stack spacing={1} mb={3}>
            {loading ? (
              <Typography>Loading…</Typography>
            ) : (
              <>
                <Typography>
                  <strong>Name:</strong> {profile?.name || "(not set)"}
                </Typography>
                <Typography>
                  <strong>Bio:</strong> {profile?.bio || "(not set)"}
                </Typography>
                <Typography>
                  <strong>Interests:</strong>{" "}
                  {Array.isArray(profile?.interests)
                    ? profile!.interests.join(", ")
                    : profile?.interests || "(not set)"}
                </Typography>
              </>
            )}
          </Stack>

          <Button variant="contained" component={Link} to="/profile/edit">
            Edit Profile
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
