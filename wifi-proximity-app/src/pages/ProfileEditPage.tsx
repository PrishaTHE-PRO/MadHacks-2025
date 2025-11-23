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
import defaultAvatar from "../assets/defaultAvatar.png";

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

  // keep track of object URLs to clean up
  const objectUrlsRef = useRef<string[]>([]);

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
        setGalleryUrls(p.galleryUrls || []);
        setVideoUrl(p.videoUrl || "");
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    })();

    return () => {
      mounted = false;
      // clean up object URLs
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
    setPhotoURL(url); // later you can upload to Firebase Storage & store real URL
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
    if (urls.length) {
      setGalleryUrls(urls);
    }
  };

  const handleVideoFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Video must be a video file (mp4, webm, etc).");
      return;
    }
    const tempUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = tempUrl;
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;
      if (duration > 60) {
        setError("Video must be at most 60 seconds long.");
        return;
      }
      pushObjectUrl(tempUrl);
      setVideoUrl(tempUrl);
    };
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
        galleryUrls,
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

  const rawResumeUrl = profile?.resumeUrl || "";
  const resumeEmbedUrl = rawResumeUrl.includes("drive.google.com/file/d/")
    ? rawResumeUrl.replace(/\/view.*$/, "/preview")
    : rawResumeUrl;

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
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            boxShadow: 6,
            backdropFilter: "blur(8px)",
          }}
        >
          <Typography variant="h5" gutterBottom align="center">
            Edit Profile
          </Typography>

          <Stack spacing={3} alignItems="center" sx={{ mb: 2 }}>
            <Avatar
              src={photoURL || defaultAvatar}
              sx={{
                width: 120,
                height: 120,
                boxShadow: 4,
                border: "3px solid white",
              }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCameraIcon />}
              >
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handlePhotoFile(e.target.files?.[0] || null)}
                />
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
              {profile.resumeUrl && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    Resume
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      p: 1,
                      bgcolor: "background.default",
                      height: 300,
                      overflow: "hidden",
                    }}
                  >
                    <iframe
                      src={resumeEmbedUrl}
                      title="Resume"
                      style={{
                        border: "none",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  </Box>
                </>
              )}

              {/* Gallery */}
              <Divider flexItem />
              <Typography variant="subtitle1">
                Photo Gallery (up to 5 images)
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<ImageIcon />}
                >
                  Upload Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => handleGalleryFiles(e.target.files)}
                  />
                </Button>
                <TextField
                  label="Image URLs (comma separated, optional)"
                  fullWidth
                  value={galleryUrls.join(", ")}
                  onChange={(e) =>
                    setGalleryUrls(
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </Stack>

              {/* Video */}
              <Divider flexItem />
              <Typography variant="subtitle1">
                Video Portfolio (max 60 seconds)
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<MovieIcon />}
                >
                  Upload Video
                  <input
                    type="file"
                    accept="video/*"
                    hidden
                    onChange={(e) =>
                      handleVideoFile(e.target.files?.[0] || null)
                    }
                  />
                </Button>
                <TextField
                  label="Video URL (optional)"
                  fullWidth
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
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
