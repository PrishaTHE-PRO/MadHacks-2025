import { useState, useEffect, useContext, useRef } from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { saveProfile, getProfileByUid } from "../services/profileService";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import MovieIcon from "@mui/icons-material/Movie";
import ImageIcon from "@mui/icons-material/Image";

// 🔥 Built‑in fallback avatar — no file needed, cannot break
const FALLBACK_AVATAR =
  "data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjYmJiIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNSIvPjxwYXRoIGQ9Ik0xMiAxNGMtNC4xIDAtOCAyLjItOCA0djJoMTZ2LTJjMC0xLjgtMy45LTQtOC00eiIvPjwvc3ZnPg==";

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
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const objectUrlsRef = useRef<string[]>([]);

  // LOAD EXISTING PROFILE
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
        setInterests(Array.isArray(p.interests) ? p.interests.join(", ") : p.interests || "");
        setLinkedin(p.linkedin || "");
        setWebsite(p.website || "");

        setPhotoURL(p.photoURL || "");
        setResumeUrl(p.resumeUrl || "");
        setGalleryUrls(p.galleryUrls || []);
        setVideoUrl(p.videoUrl || "");
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    })();

    return () => {
      mounted = false;
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [user]);

  const pushObjectUrl = (url: string) => {
    objectUrlsRef.current.push(url);
  };

  const handlePhotoFile = (file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    pushObjectUrl(url);
    setPhotoURL(url);
  };

  const handleResumeFile = (file: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Resume must be a PDF file.");
      return;
    }
    const url = URL.createObjectURL(file);
    pushObjectUrl(url);
    setResumeUrl(url);
  };

  const handleGalleryFiles = (files: FileList | null) => {
    if (!files) return;
    const urls: string[] = [];

    Array.from(files)
      .slice(0, 5)
      .forEach((file) => {
        if (file.type.startsWith("image/")) {
          const url = URL.createObjectURL(file);
          pushObjectUrl(url);
          urls.push(url);
        }
      });

    if (urls.length) setGalleryUrls(urls);
  };

  const handleVideoFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Video must be a valid video file.");
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    const video = document.createElement("video");

    video.preload = "metadata";
    video.src = tempUrl;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      if (video.duration > 60) {
        setError("Video must be under 60 seconds!");
        return;
      }
      pushObjectUrl(tempUrl);
      setVideoUrl(tempUrl);
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) return setError("You must be signed in.");

    setLoading(true);

    try {
      await saveProfile(user.uid, {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        bio,
        interests: interests.split(",").map((v) => v.trim()).filter(Boolean),
        linkedin,
        website,
        photoURL,
        resumeUrl,
        galleryUrls,
        videoUrl,
      });

      navigate("/profile/me");
    } catch (err) {
      console.error(err);
      setError("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", pt: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: 6 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Edit Profile
          </Typography>

          {/* Avatar */}
          <Stack spacing={3} alignItems="center" sx={{ mb: 2 }}>
            <Avatar
              src={photoURL || FALLBACK_AVATAR}
              sx={{
                width: 120,
                height: 120,
                border: "3px solid white",
                boxShadow: 4,
              }}
            />

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" component="label" startIcon={<PhotoCameraIcon />}>
                Upload Photo
                <input type="file" accept="image/*" hidden onChange={(e) => handlePhotoFile(e.target.files?.[0] || null)} />
              </Button>

              <TextField
                size="small"
                label="Photo URL"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
              />
            </Stack>
          </Stack>

          <Box component="form" onSubmit={handleSave}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="First Name" fullWidth value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <TextField label="Last Name" fullWidth value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Stack>

              <TextField label="Bio" fullWidth multiline minRows={3} value={bio} onChange={(e) => setBio(e.target.value)} />

              <TextField
                label="Interests (comma separated)"
                fullWidth
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="LinkedIn URL" fullWidth value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                <TextField label="Website" fullWidth value={website} onChange={(e) => setWebsite(e.target.value)} />
              </Stack>

              <Divider />

              <Typography variant="subtitle1">Resume (PDF)</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                  Upload PDF
                  <input type="file" accept="application/pdf" hidden onChange={(e) => handleResumeFile(e.target.files?.[0] || null)} />
                </Button>

                <TextField label="Resume URL" fullWidth value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} />
              </Stack>

              <Divider />

              <Typography variant="subtitle1">Photo Gallery (up to 5)</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button variant="outlined" component="label" startIcon={<ImageIcon />}>
                  Upload Images
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => handleGalleryFiles(e.target.files)} />
                </Button>

                <TextField
                  label="Image URLs (optional)"
                  fullWidth
                  value={galleryUrls.join(", ")}
                  onChange={(e) =>
                    setGalleryUrls(e.target.value.split(",").map((v) => v.trim()).filter(Boolean))
                  }
                />
              </Stack>

              <Divider />

              <Typography variant="subtitle1">Video Portfolio (max 60 seconds)</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button variant="outlined" component="label" startIcon={<MovieIcon />}>
                  Upload Video
                  <input type="file" accept="video/*" hidden onChange={(e) => handleVideoFile(e.target.files?.[0] || null)} />
                </Button>

                <TextField label="Video URL (optional)" fullWidth value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
              </Stack>

              {error && <Typography color="error">{error}</Typography>}

              <Button variant="contained" type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save Profile"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
