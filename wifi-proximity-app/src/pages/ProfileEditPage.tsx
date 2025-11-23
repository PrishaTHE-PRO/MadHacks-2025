import { useState, useEffect, useContext } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { saveProfile, getProfileByUid } from "../services/profileService";

export function ProfileEditPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [resumeURL, setResumeURL] = useState("");
  const [image1, setImage1] = useState("");
  const [image2, setImage2] = useState("");
  const [image3, setImage3] = useState("");
  const [image4, setImage4] = useState("");
  const [image5, setImage5] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Load existing profile
  useEffect(() => {
    if (!user) return;
    let mounted = true;

    (async () => {
      try {
        const p = await getProfileByUid(user.uid);
        if (!mounted || !p) return;

        setFirstName(p.firstName || "");
        setLastName(p.lastName || "");
        setBio(p.bio || "");
        setLinkedin(p.linkedin || "");
        setWebsite(p.website || "");
        setPhotoURL(p.photoURL || "");
        setResumeURL(p.resumeURL || "");
        const imgs: string[] = Array.isArray(p.images) ? p.images : [];
        setImage1(imgs[0] || "");
        setImage2(imgs[1] || "");
        setImage3(imgs[2] || "");
        setImage4(imgs[3] || "");
        setImage5(imgs[4] || "");
        setVideoURL(p.videoURL || "");
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
      const images = [image1, image2, image3, image4, image5].filter(Boolean);

      await saveProfile(user.uid, {
        firstName,
        lastName,
        bio,
        linkedin,
        website,
        photoURL,
        resumeURL,
        images,
        videoURL,
      });

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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Fill out as much as you want — empty fields won&apos;t show on your
            public profile.
          </Typography>

          <Box component="form" onSubmit={handleSave}>
            <Stack spacing={2}>
              {/* Name */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="First name"
                  fullWidth
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
                <TextField
                  label="Last name"
                  fullWidth
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
              </Stack>

              {/* Bio */}
              <TextField
                label="Bio"
                fullWidth
                multiline
                minRows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={loading}
              />

              <Divider sx={{ my: 1 }} />

              {/* Links */}
              <TextField
                label="LinkedIn URL"
                placeholder="https://www.linkedin.com/in/your-handle"
                fullWidth
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Website / Portfolio URL"
                placeholder="https://yourwebsite.com"
                fullWidth
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                disabled={loading}
              />

              <Divider sx={{ my: 1 }} />

              {/* Media URLs */}
              <TextField
                label="Profile picture URL"
                placeholder="Paste an image URL (will show as a circle)"
                fullWidth
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                disabled={loading}
              />

              <TextField
                label="Resume PDF URL"
                placeholder="Paste a PDF URL (Google Drive, etc.)"
                fullWidth
                value={resumeURL}
                onChange={(e) => setResumeURL(e.target.value)}
                disabled={loading}
              />

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle1">
                Gallery (up to 5 image URLs)
              </Typography>
              <TextField
                label="Image 1 URL"
                fullWidth
                value={image1}
                onChange={(e) => setImage1(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Image 2 URL"
                fullWidth
                value={image2}
                onChange={(e) => setImage2(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Image 3 URL"
                fullWidth
                value={image3}
                onChange={(e) => setImage3(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Image 4 URL"
                fullWidth
                value={image4}
                onChange={(e) => setImage4(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="Image 5 URL"
                fullWidth
                value={image5}
                onChange={(e) => setImage5(e.target.value)}
                disabled={loading}
              />

              <Divider sx={{ my: 1 }} />

              <TextField
                label="Video URL (max 1 minute)"
                placeholder="Paste a hosted video URL"
                fullWidth
                value={videoURL}
                onChange={(e) => setVideoURL(e.target.value)}
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
