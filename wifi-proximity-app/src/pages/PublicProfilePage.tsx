// src/pages/ProfileViewPage.tsx
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getProfileBySlug } from "../services/profileService";
import { saveInteraction } from "../services/eventService";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import { motion } from "framer-motion";

interface Profile {
  slug: string;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  interests?: string[];
  linkedin?: string;
  website?: string;
  photoURL?: string;
  resumeUrl?: string;
  galleryUrls?: string[];
  videoUrl?: string;
  userId: string;
}

const MotionIconButton = motion(IconButton);

export function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const eventCode = searchParams.get("eventCode");
  const backTo = searchParams.get("back") || "events";
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (slug) {
      getProfileBySlug(slug)
        .then((data) => {
          if (data) {
            setProfile(data as Profile);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [slug]);

  const handleBack = async () => {
    if (user && eventCode && profile && !saved) {
      await saveInteraction({
        ownerUserId: user.uid,
        otherUserId: profile.userId,
        eventCode: eventCode,
        note: "Met via proximity detection",
      });
      setSaved(true);
    }

    if (backTo === "nearby" && eventCode) {
      navigate(`/nearby/${eventCode}`);
    } else if (backTo === "contacts" && eventCode) {
      navigate(`/events/${eventCode}`);
    } else if (eventCode) {
      navigate(`/events/${eventCode}`);
    } else {
      navigate("/events");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}>
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}>
        <Typography>Profile not found</Typography>
      </Box>
    );
  }

  const rawResumeUrl = profile.resumeUrl || "";
  const resumeEmbedUrl = rawResumeUrl.includes("drive.google.com/file/d/")
    ? rawResumeUrl.replace(/\/view.*$/, "/preview")
    : rawResumeUrl;

  function getYouTubeEmbedUrl(url: string): string | null {
    try {
      const u = new URL(url);
      // https://www.youtube.com/watch?v=VIDEO_ID
      if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
        return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
      }
      // https://youtu.be/VIDEO_ID
      if (u.hostname === "youtu.be") {
        return `https://www.youtube.com/embed${u.pathname}`;
      }
    } catch {
      // invalid URL
    }
    return null;
  }

  const youtubeEmbedUrl = profile.videoUrl
    ? getYouTubeEmbedUrl(profile.videoUrl)
    : null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5", pt: 8 }}>
      {/* Back Button with swipe-left animation on click */}
      <Box sx={{ position: "fixed", top: 70, left: 16, zIndex: 1000 }}>
        <MotionIconButton
          onClick={handleBack}
          whileTap={{ x: -10, opacity: 0.7 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          sx={{
            bgcolor: "white",
            boxShadow: 2,
            "&:hover": { bgcolor: "grey.100" },
          }}
        >
          <ArrowBackIcon />
        </MotionIconButton>
      </Box>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          {/* Profile Header */}
          <Stack direction="column" alignItems="center" spacing={2}>
            <Avatar
              src={profile.photoURL}
              sx={{
                width: 120,
                height: 120,
                bgcolor: "primary.main",
                boxShadow: 3,
              }}
            >
              {profile.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h4" align="center">
              {profile.name}
            </Typography>
            {profile.bio && (
              <Typography
                variant="body1"
                color="text.secondary"
                align="center"
              >
                {profile.bio}
              </Typography>
            )}
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Contact Information */}
          <Stack spacing={2}>
            {profile.email && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon color="action" />
                <Typography>{profile.email}</Typography>
              </Box>
            )}

            {profile.phone && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PhoneIcon color="action" />
                <Typography>{profile.phone}</Typography>
              </Box>
            )}

            {profile.linkedin && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LinkedInIcon color="action" />
                <Typography
                  component="a"
                  href={profile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  sx={{
                    textDecoration: "none",
                    color: "primary.main",
                  }}
                >
                  LinkedIn Profile
                </Typography>
              </Box>
            )}

            {profile.website && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography fontWeight={600}>Website:</Typography>
                <Typography
                  component="a"
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  sx={{ textDecoration: "none", color: "primary.main" }}
                >
                  {profile.website}
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Interests
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {profile.interests.map((interest, index) => (
                  <Chip
                    key={index}
                    label={interest}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </>
          )}

          {/* Resume */}
          {profile?.resumeUrl && (
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
          {profile.galleryUrls && profile.galleryUrls.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Photo Gallery
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  overflowX: "auto",
                  pb: 1,
                }}
              >
                {profile.galleryUrls.map((url, idx) => (
                  <Box
                    key={idx}
                    component="img"
                    src={url}
                    alt={`Gallery ${idx + 1}`}
                    sx={{
                      width: 180,
                      height: 180,
                      objectFit: "cover",
                      borderRadius: 2,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </Box>
            </>
          )}

          {/* Video */}
          {profile.videoUrl && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Video Portfolio
              </Typography>

              {youtubeEmbedUrl ? (
                // YouTube embed
                <Box
                  component="iframe"
                  src={youtubeEmbedUrl}
                  title="YouTube video"
                  sx={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    border: 0,
                    borderRadius: 2,
                    boxShadow: 3,
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                // direct video file (mp4, webm, etc.)
                <Box
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "black",
                  }}
                >
                  <video
                    src={profile.videoUrl}
                    controls
                    style={{
                      width: "100%",
                      maxHeight: 260,
                      display: "block",
                    }}
                  />
                </Box>
              )}
            </>
          )}

          {/* Action Button */}
          <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleBack}
            >
              {saved ? "Contact Saved! Go Back" : "Save Contact & Go Back"}
            </Button>
          </Box>
        </Paper>

        {eventCode && (
          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            sx={{ display: "block", mt: 2 }}
          >
            Met at event: {eventCode}
          </Typography>
        )}
      </Container>
    </Box>
  );
}

