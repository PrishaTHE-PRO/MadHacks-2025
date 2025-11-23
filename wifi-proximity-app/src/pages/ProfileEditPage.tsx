import { useState, useEffect, useContext } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  Avatar,
  Divider,
  IconButton,
} from "@mui/material";
import { keyframes } from "@mui/system";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { saveProfile, getProfileByUid } from "../services/profileService";
import DeleteIcon from "@mui/icons-material/Delete";

// simple animation helpers
const floatIn = keyframes`
  0% { opacity: 0; transform: translateY(16px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(25,118,210,0.4); }
  70% { box-shadow: 0 0 0 10px rgba(25,118,210,0); }
  100% { box-shadow: 0 0 0 0 rgba(25,118,210,0); }
`;

const normalizeGallery = (arr: string[]): string[] => {
  const filled = arr.filter(Boolean);
  return [...filled, ...Array(5 - filled.length).fill("")].slice(0, 5);
};

export function ProfileEditPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [photoURL, setPhotoURL] = useState<string>("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>(["", "", "", "", ""]);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    (async () => {
      try {
        const p = await getProfileByUid(user.uid);
        if (!mounted || !p) return;

        const nameParts = (p.name || "").split(" ");
        setFirstName(p.firstName || nameParts[0] || "");
        setLastName(p.lastName || nameParts.slice(1).join(" ") || "");
        setBio(p.bio || "");
        if (Array.isArray(p.interests)) {
          setInterests(p.interests.join(", "));
        } else if (p.interests) {
          setInterests(p.interests);
        }
        setLinkedin(p.linkedin || "");
        setWebsite(p.website || "");
        setPhotoURL(p.photoURL || "");
        setResumeUrl(p.resumeUrl || "");

        if (Array.isArray(p.galleryUrls)) {
          setGalleryUrls(normalizeGallery(p.galleryUrls));
        }

        setVideoUrl(p.videoUrl || "");
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleGalleryUrlAtIndex = (index: number, value: string) => {
    const next = [...galleryUrls];
    next[index] = value.trim();
    setGalleryUrls(normalizeGallery(next));
  };

  const clearGallerySlot = (index: number) => {
    const next = [...galleryUrls];
    next[index] = "";
    setGalleryUrls(normalizeGallery(next));
  };
  
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

      const nameCombined = `${firstName} ${lastName}`.trim();

      // only keep non-empty gallery URLs
      const compactGallery = galleryUrls.filter(Boolean);

      await saveProfile(user.uid, {
        firstName,
        lastName,
        name: nameCombined,
        bio,
        interests: interestsArr,
        linkedin,
        website,
        photoURL,
        resumeUrl,
        galleryUrls: compactGallery,
        videoUrl,
      });

      navigate("/profile/me");
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const avatarInitial =
    (firstName || lastName || "U").trim().charAt(0).toUpperCase();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, rgba(25,118,210,0.12), transparent 60%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            boxShadow: 6,
            backdropFilter: "blur(10px)",
            animation: `${floatIn} 0.5s ease-out`,
          }}
        >
          <Typography variant="h5" gutterBottom align="center">
            Edit Profile
          </Typography>

          {/* avatar + photo upload */}
          <Stack spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Avatar
              src={photoURL || undefined}
              sx={{
                width: 128,
                height: 128,
                border: "3px solid white",
                boxShadow: 4,
                animation: `${pulseGlow} 2.4s infinite`,
                bgcolor: "primary.main",
                fontSize: 40,
              }}
            >
              {avatarInitial}
            </Avatar>

            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                aria-label="remove photo"
                onClick={() => setPhotoURL("")}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>

            <TextField
              size="small"
              label="Photo URL (optional)"
              fullWidth
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
            />
          </Stack>

          <Box component="form" onSubmit={handleSave}>
            <Stack spacing={2}>
              {/* name row */}
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

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="LinkedIn URL"
                  fullWidth
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  disabled={loading}
                />
                <TextField
                  label="Website"
                  fullWidth
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  disabled={loading}
                />
              </Stack>

              <Divider flexItem />

              {/* Resume */}
              <Typography variant="subtitle1">Resume (PDF)</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Resume URL (optional)"
                  fullWidth
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                />
                <IconButton
                  aria-label="remove resume"
                  onClick={() => setResumeUrl("")}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Divider flexItem />

              {/* Gallery */}
              <Typography variant="subtitle1">
                Photo Gallery (up to 5 images)
              </Typography>

              <Stack spacing={1}>
                {galleryUrls.map((url, index) => (
                  <Stack
                    key={index}
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems="center"
                  >
                    <Typography
                      variant="body2"
                      sx={{ width: 60, flexShrink: 0 }}
                    >
                      Image {index + 1}
                    </Typography>
                    <TextField
                      size="small"
                      label="Image URL (optional)"
                      fullWidth
                      value={url}
                      onChange={(e) =>
                        handleGalleryUrlAtIndex(index, e.target.value)
                      }
                    />
                    <IconButton
                      aria-label={`remove image ${index + 1}`}
                      onClick={() => clearGallerySlot(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>

              <Divider flexItem />

              {/* Video */}
              <Typography variant="subtitle1">
                Video Portfolio (max 60 seconds)
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Video URL (optional)"
                  fullWidth
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <IconButton
                  aria-label="remove video"
                  onClick={() => setVideoUrl("")}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>

              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}

              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
