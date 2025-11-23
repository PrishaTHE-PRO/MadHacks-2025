import { useState, useEffect, useContext } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { saveProfile, getProfileByUid } from "../services/profileService";

export function ProfileEditPage() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const p = await getProfileByUid(user.uid);
        if (!mounted || !p) return;
        setName(p.name || "");
        setBio(p.bio || "");
        if (Array.isArray(p.interests)) setInterests(p.interests.join(", "));
        else setInterests(p.interests || "");
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) {
      setError("You must be signed in to save your profile.");
      return;
    }
    setLoading(true);
    try {
      const interestsArr = interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await saveProfile(user.uid, {
        name,
        bio,
        interests: interestsArr,
      });

      // navigate to My Profile on success
      navigate("/profile/me");
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

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
            Edit Profile
          </Typography>

          <Box component="form" onSubmit={handleSave}>
            <Stack spacing={2}>
              <TextField
                label="Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Bio"
                fullWidth
                multiline
                minRows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Interests (comma separated)"
                fullWidth
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                disabled={loading}
              />

              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}

              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

