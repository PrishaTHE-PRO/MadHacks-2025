import { Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Avatar,
  IconButton,
  Collapse,
  Card,
  CardMedia,
  Divider,
  Button,
} from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import { getProfileByUid } from "../services/profileService";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LanguageIcon from "@mui/icons-material/Language";

interface Profile {
  firstName?: string;
  lastName?: string;
  bio?: string;
  linkedin?: string;
  website?: string;
  photoURL?: string;
  resumeURL?: string;
  images?: string[];
  videoURL?: string;
}

export function ProfileMePage() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResume, setShowResume] = useState(false);

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

  const fullName =
    (profile?.firstName || "") + " " + (profile?.lastName || "");

  const images = Array.isArray(profile?.images) ? profile!.images : [];

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
          {loading ? (
            <Typography>Loading…</Typography>
          ) : (
            <>
              {/* Name */}
              <Typography
                variant="h4"
                align="center"
                sx={{ fontWeight: 700 }}
              >
                {fullName.trim() || "(Name not set)"}
              </Typography>

              {/* Profile picture */}
              {profile?.photoURL && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    my: 2,
                  }}
                >
                  <Avatar
                    src={profile.photoURL}
                    sx={{ width: 120, height: 120 }}
                  />
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Resume */}
              {profile?.resumeURL && (
                <>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<InsertDriveFileIcon />}
                    sx={{ mb: 2 }}
                    onClick={() => setShowResume((s) => !s)}
                  >
                    {showResume ? "Hide Resume" : "View Resume"}
                  </Button>
                  <Collapse in={showResume}>
                    <iframe
                      src={profile.resumeURL}
                      style={{
                        width: "100%",
                        height: 400,
                        borderRadius: 8,
                        border: "none",
                      }}
                    />
                  </Collapse>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* Links */}
              {(profile?.linkedin || profile?.website) && (
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  {profile.linkedin && (
                    <IconButton
                      href={profile.linkedin}
                      target="_blank"
                      aria-label="LinkedIn"
                    >
                      <LinkedInIcon />
                    </IconButton>
                  )}
                  {profile.website && (
                    <IconButton
                      href={profile.website}
                      target="_blank"
                      aria-label="Website"
                    >
                      <LanguageIcon />
                    </IconButton>
                  )}
                </Stack>
              )}

              {/* Bio */}
              {profile?.bio && (
                <>
                  <Typography sx={{ mb: 2 }}>{profile.bio}</Typography>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* Gallery */}
              {images.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Gallery
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      overflowX: "auto",
                      gap: 2,
                      py: 1,
                    }}
                  >
                    {images.map((url, idx) => (
                      <Card
                        key={idx}
                        sx={{ minWidth: 200, borderRadius: 2 }}
                      >
                        <CardMedia
                          component="img"
                          image={url}
                          height="140"
                          alt={`gallery-${idx}`}
                        />
                      </Card>
                    ))}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* Video */}
              {profile?.videoURL && (
                <>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Video Portfolio
                  </Typography>
                  <video
                    src={profile.videoURL}
                    controls
                    style={{
                      width: "100%",
                      maxHeight: 300,
                      borderRadius: 12,
                    }}
                  />
                </>
              )}
            </>
          )}

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button variant="contained" component={Link} to="/profile/edit">
              Edit Profile
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
