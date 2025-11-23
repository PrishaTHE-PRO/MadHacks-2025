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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LanguageIcon from "@mui/icons-material/Language";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import defaultAvatar from "../assets/defaultAvatar.png";

interface Profile {
  slug: string;
  firstName?: string;
  lastName?: string;
  name?: string;
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

export function ProfileViewPage() {
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
    if (!slug) return;
    getProfileBySlug(slug)
      .then((data) => {
        if (data) setProfile(data as Profile);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleBack = async () => {
    if (user && eventCode && profile && !saved) {
      await saveInteraction({
        ownerUserId: user.uid,
        otherUserId: profile.userId,
        eventCode,
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

  const fullName =
    (profile.firstName || profile.name || "") +
    (profile.lastName ? ` ${profile.lastName}` : "");

  const hasResume = !!profile.resumeUrl;
  const gallery = profile.galleryUrls || [];
  const hasVideo = !!profile.videoUrl;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0b1020",
        pt: 7,
        pb: 4,
      }}
    >
      {/* back button */}
      <Box sx={{ position: "fixed", top: 70, left: 16, zIndex: 1000 }}>
        <IconButton
          onClick={handleBack}
          sx={{
            bgcolor: "rgba(15, 23, 42, 0.9)",
            color: "white",
            boxShadow: 4,
            "&:hover": { bgcolor: "rgba(30, 64, 175, 0.9)" },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>

      <Container
        maxWidth="xs"
        sx={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 3,
            borderRadius: 4,
            width: "100%",
            maxWidth: 420,
            bgcolor: "rgba(15,23,42,0.96)",
            color: "white",
            backdropFilter: "blur(16px)",
            boxShadow:
              "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(148,163,184,0.2)",
          }}
        >
          {/* header */}
          <Stack spacing={2} alignItems="center">
            <Avatar
              src={profile.photoURL || defaultAvatar}
              sx={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                boxShadow: 6,
                border: "3px solid rgba(148,163,184,0.7)",
              }}
            />
            <Typography variant="h5" align="center" sx={{ fontWeight: 600 }}>
              {fullName || "Unnamed User"}
            </Typography>
          </Stack>

          <Divider sx={{ my: 2, borderColor: "rgba(148,163,184,0.4)" }} />

          {/* links + contact */}
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            {profile.email && (
              <Stack direction="row" spacing={1} alignItems="center">
                <EmailIcon fontSize="small" />
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  {profile.email}
                </Typography>
              </Stack>
            )}

            {profile.phone && (
              <Stack direction="row" spacing={1} alignItems="center">
                <PhoneIcon fontSize="small" />
                <Typography variant="body2">{profile.phone}</Typography>
              </Stack>
            )}

            {profile.linkedin && (
              <Stack direction="row" spacing={1} alignItems="center">
                <LinkedInIcon fontSize="small" />
                <Typography
                  component="a"
                  href={profile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  variant="body2"
                  sx={{
                    color: "rgb(96,165,250)",
                    textDecoration: "none",
                    wordBreak: "break-all",
                  }}
                >
                  LinkedIn
                </Typography>
              </Stack>
            )}

            {profile.website && (
              <Stack direction="row" spacing={1} alignItems="center">
                <LanguageIcon fontSize="small" />
                <Typography
                  component="a"
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  variant="body2"
                  sx={{
                    color: "rgb(96,165,250)",
                    textDecoration: "none",
                    wordBreak: "break-all",
                  }}
                >
                  Website
                </Typography>
              </Stack>
            )}
          </Stack>

          {/* Bio */}
          {profile.bio && (
            <>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 0.5 }}
              >
                Bio
              </Typography>
              <Typography
                variant="body2"
                sx={{ mb: 2, color: "rgba(226,232,240,0.9)" }}
              >
                {profile.bio}
              </Typography>
            </>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 1, mt: 1 }}
              >
                Interests
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  mb: 2,
                }}
              >
                {profile.interests.map((interest, idx) => (
                  <Chip
                    key={idx}
                    label={interest}
                    variant="outlined"
                    sx={{
                      borderColor: "rgba(148,163,184,0.7)",
                      color: "rgba(226,232,240,0.9)",
                    }}
                  />
                ))}
              </Box>
            </>
          )}

          {/* Resume – only if present */}
          {hasResume && (
            <>
              <Accordion
                sx={{
                  bgcolor: "rgba(15,23,42,0.9)",
                  borderRadius: 2,
                  border: "1px solid rgba(148,163,184,0.5)",
                  mb: 2,
                  "&::before": { display: "none" },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PictureAsPdfIcon fontSize="small" />
                    <Typography variant="subtitle2">View Résumé</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    sx={{
                      width: "100%",
                      height: 260,
                      borderRadius: 2,
                      overflow: "hidden",
                      bgcolor: "black",
                    }}
                  >
                    <object
                      data={profile.resumeUrl}
                      type="application/pdf"
                      style={{ width: "100%", height: "100%" }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ p: 2, color: "white" }}
                      >
                        Unable to preview PDF.{" "}
                        <a
                          href={profile.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#60a5fa" }}
                        >
                          Open in new tab
                        </a>
                        .
                      </Typography>
                    </object>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </>
          )}

          {/* Gallery – only if there are images */}
          {gallery.length > 0 && (
            <>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 1, mt: 1 }}
              >
                Gallery
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  overflowX: "auto",
                  gap: 1.5,
                  pb: 1,
                  mb: 2,
                  "&::-webkit-scrollbar": {
                    height: 6,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(148,163,184,0.7)",
                    borderRadius: 999,
                  },
                }}
              >
                {gallery.map((url, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      flexShrink: 0,
                      width: 160,
                      height: 120,
                      borderRadius: 2,
                      overflow: "hidden",
                      boxShadow: 3,
                    }}
                  >
                    <img
                      src={url}
                      alt={`gallery-${idx}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* Video – only if present */}
          {hasVideo && (
            <>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 1, mt: 1 }}
              >
                Video Portfolio
              </Typography>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: 4,
                  mb: 2,
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    bgcolor: "rgba(15,23,42,0.7)",
                    borderRadius: 999,
                    px: 1.5,
                    py: 0.25,
                  }}
                >
                  <SlideshowIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption">≤ 60s</Typography>
                </Box>
                <video
                  src={profile.videoUrl}
                  controls
                  style={{
                    width: "100%",
                    maxHeight: 260,
                    display: "block",
                    background: "black",
                  }}
                />
              </Box>
            </>
          )}

          {/* Save & back button */}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleBack}
            >
              {saved ? "Contact Saved • Back" : "Save Contact & Back"}
            </Button>
          </Box>

          {eventCode && (
            <Typography
              variant="caption"
              color="rgba(148,163,184,0.9)"
              align="center"
              sx={{ display: "block", mt: 1.5 }}
            >
              Met at event: {eventCode}
            </Typography>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
