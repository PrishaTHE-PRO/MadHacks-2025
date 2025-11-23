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

interface Profile {
  slug: string;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  interests?: string[];
  linkedin?: string;
  photoURL?: string;
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5", pt: 8 }}>
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
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          {/* Profile Header */}
          <Stack direction="column" alignItems="center" spacing={2}>
            <Avatar
              src={profile.photoURL}
              sx={{ width: 120, height: 120, bgcolor: "primary.main" }}
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
                  sx={{ textDecoration: "none", color: "primary.main" }}
                >
                  LinkedIn Profile
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
                  <Chip key={index} label={interest} color="primary" variant="outlined" />
                ))}
              </Box>
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
