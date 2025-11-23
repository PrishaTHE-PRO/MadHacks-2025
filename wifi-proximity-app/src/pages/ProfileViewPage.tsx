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
import { keyframes } from "@mui/system";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LanguageIcon from "@mui/icons-material/Language";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import MovieIcon from "@mui/icons-material/Movie";

interface Profile {
  slug: string;
  name: string;
  firstName?: string;
  lastName?: string;
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

const floatIn = keyframes`
  0% { opacity: 0; transform: translateY(16px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const cardHover = {
  transition: "transform 0.25s ease, box-shadow 0.25s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: 8,
  },
};

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
    // Save contact if we have event code and user
    if (user && eventCode && profile && !saved) {
      await saveInteraction({
        ownerUserId: user.uid,
        otherUserId: profile.userId,
        eventCode: eventCode,
        note: "Met via proximity detection",
      });
      setSaved(true);
    }

    // Navigate back
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

  const avatarInitial =
    (profile.name || profile.firstName || "").trim().charAt(0).toUpperCase() ||
    "U";

  const gallery = (profile.galleryUrls || []).filter(Boolean);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        pt: 8,
        background:
          "radial-gradient(circle at top, rgba(25,118,210,0.13), transparent 60%)",
      }}
    >
      {/* Back Button */}
      <Box sx={{ position: "fixed", top: 70, left: 16, zIndex: 1000 }}>
        <IconButton
          onClick={handleBack}
          sx={{
            bgcolor: "white",
            boxShadow: 2,
            "&:hover": { bgcolor: "grey.100" },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 4,
            animation: `${floatIn} 0.45s ease-out`,
            ...cardHover,
          }}
        >
          {/* Profile Header */}
          <Stack direction="column" alignItems="center" spacing={2}>
            <Avatar
              src={profile.photoURL || undefined}
              sx={{
                width: 120,
                height: 120,
                bgcolor: "primary.main",
                fontSize: 40,
              }}
            >
              {avatarInitial}
            </Avatar>
            <Typography variant="h4" align="center">
              {profile.name}
            </Typography>
            {profile.bio && (
              <Box sx={{ mt: 1, width: "100%" }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  Bio
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-line" }}
                >
                  {profile.bio}
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Contact & Links */}
          <Stack spacing={1.5}>
            {profile.email && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon color="action" />
                <Typography sx={{ wordBreak: "break-word" }}>
                  {profile.email}
                </Typography>
              </Box>
            )}

            {profile.phone && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PhoneIcon color="action" />
                <Typography sx={{ wordBreak: "break-word" }}>
                  {profile.phone}
                </Typography>
              </Box>
            )}

            {profile.linkedin && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LinkedInIcon color="action" />
                <Typography
                  component="a"
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    textDecoration: "none",
                    color: "primary.main",
                    wordBreak: "break-word",
                  }}
                >
                  LinkedIn
                </Typography>
              </Box>
            )}

            {profile.website && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LanguageIcon color="action" />
                <Typography
                  component="a"
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    textDecoration: "none",
                    color: "primary.main",
                    wordBreak: "break-word",
                  }}
                >
                  Website
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
          {profile.resumeUrl && (
            <>
              <Divider sx={{ my: 3 }} />
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <PictureAsPdfIcon fontSize="small" />
                <Typography variant="h6">Resume</Typography>
              </Stack>
              <Box
                component="iframe"
                src={profile.resumeUrl}
                title="Resume"
                sx={{
                  width: "100%",
                  height: 320,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              />
            </>
          )}

          {/* Photo Gallery */}
          {gallery.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <PhotoLibraryIcon fontSize="small" />
                <Typography variant="h6">Photos</Typography>
              </Stack>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 1.5,
                  overflowX: "auto",
                  py: 1,
                  px: 0.5,
                }}
              >
                {gallery.map((url, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      flex: "0 0 70%",
                      maxWidth: 280,
                      borderRadius: 2,
                      overflow: "hidden",
                      boxShadow: 3,
                      ...cardHover,
                    }}
                  >
                    <Box
                      component="img"
                      src={url}
                      alt={`Gallery ${idx + 1}`}
                      sx={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        aspectRatio: "4 / 3",
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* Video Portfolio */}
          {profile.videoUrl && (
            <>
              <Divider sx={{ my: 3 }} />
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <MovieIcon fontSize="small" />
                <Typography variant="h6">Video Portfolio</Typography>
              </Stack>
              <Box
                component="video"
                src={profile.videoUrl}
                controls
                sx={{
                  width: "100%",
                  borderRadius: 2,
                  boxShadow: 4,
                  maxHeight: 320,
                  objectFit: "cover",
                }}
              />
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
