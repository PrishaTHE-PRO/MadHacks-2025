// src/pages/ProfileViewPage.tsx
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getProfileByIdOrSlug } from "../services/profileService";
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
    let cancelled = false;

    async function load() {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const data = await getProfileByIdOrSlug(slug);
        console.log("ProfileView slug =", slug, "data =", data);
        if (!cancelled && data) {
          setProfile(data as Profile);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleBack = async () => {
    if (user && eventCode && profile && !saved) {
      await saveInteraction({
        ownerUserId: user.uid,
        otherUserId: profile.userId,   // this is the UID, *not* the slug
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

  // If we truly didn't find anything, don't render the card at all
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
      {/* SIMPLE back button inside the content instead of a fixed floating one */}
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Button
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back
        </Button>

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

          {/* Contact & Links, interests, resume, gallery, video – keep your existing sections here unchanged */}
          {/* ... (you can paste your previous sections for email/phone/links/interests/resume/gallery/video) ... */}

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
