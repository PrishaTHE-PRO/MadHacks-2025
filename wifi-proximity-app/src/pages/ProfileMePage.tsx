import { useEffect, useState, useContext } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Avatar,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import { keyframes } from "@mui/system";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getProfileByUid } from "../services/profileService";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LanguageIcon from "@mui/icons-material/Language";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import MovieIcon from "@mui/icons-material/Movie";
import { BackButton } from "../components/BackButton";

interface Profile {
  name?: string;
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

export function ProfileMePage() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const p = await getProfileByUid(user.uid);
        if (!mounted) return;
        setProfile(p || {});
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const avatarInitial =
    (profile?.name || profile?.firstName || user?.email || "U")
      .trim()
      .charAt(0)
      .toUpperCase() || "U";

  const gallery = (profile?.galleryUrls || []).filter(Boolean);
  const rawResumeUrl = profile?.resumeUrl || "";
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

  const youtubeEmbedUrl = profile?.videoUrl
    ? getYouTubeEmbedUrl(profile.videoUrl)
    : null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, rgba(25,118,210,0.13), transparent 60%)",
      }}
    >
      <BackButton />
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            animation: `${floatIn} 0.45s ease-out`,
            ...cardHover,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h5">My Profile</Typography>
            <Button
              variant="outlined"
              size="small"
              component={Link}
              to="/profile/edit"
            >
              Edit
            </Button>
          </Stack>

          {loading ? (
            <Typography>Loading…</Typography>
          ) : (
            <>
              {/* Header */}
              <Stack direction="column" alignItems="center" spacing={2}>
                <Avatar
                  src={profile?.photoURL || undefined}
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
                  {profile?.name || "(name not set)"}
                </Typography>
                {profile?.bio && (
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

              {/* Contact & links */}
              <Stack spacing={1.5}>
                {profile?.email && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EmailIcon color="action" />
                    <Typography sx={{ wordBreak: "break-word" }}>
                      {profile.email}
                    </Typography>
                  </Box>
                )}

                {profile?.phone && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PhoneIcon color="action" />
                    <Typography sx={{ wordBreak: "break-word" }}>
                      {profile.phone}
                    </Typography>
                  </Box>
                )}

                {profile?.linkedin && (
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

                {profile?.website && (
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
              {profile?.interests && profile.interests.length > 0 && (
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

              {/* Photo Gallery */}
              {gallery.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mb={1}
                  >
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

              {/* Video */}
              {profile?.videoUrl && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <MovieIcon fontSize="small" />
                    <Typography variant="h6">Video Portfolio</Typography>
                  </Stack>

                  {youtubeEmbedUrl ? (
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
                  )}
                </>
              )}
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

