// src/pages/FavoritesPage.tsx
import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getFavoriteInteractions,
} from "../services/eventService";
import { getProfileByIdOrSlug } from "../services/profileService";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Stack,
  Avatar,
  Chip,
  Toolbar,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { BackButton } from "../components/BackButton";

interface FavoriteProfile {
  name: string;
  email?: string;
  photoURL?: string;
  slug: string;
}

interface FavoriteContact {
  id: string;
  otherUserId: string;
  eventCode: string;
  profile: FavoriteProfile;
}

export function FavoritesPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<FavoriteContact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    getFavoriteInteractions(user.uid)
      .then(async (interactions) => {
        const withProfiles = await Promise.all(
          interactions.map(async (interaction: any) => {
            const profile: any = await getProfileByIdOrSlug(
              interaction.otherUserId
            );
            if (profile) {
              return {
                ...interaction,
                profile: {
                  name: profile.name || "Unknown User",
                  email: profile.email || "",
                  photoURL: profile.photoURL || "",
                  slug: profile.slug || interaction.otherUserId,
                },
              } as FavoriteContact;
            }
            return {
              ...interaction,
              profile: {
                name: "Unknown User",
                slug: interaction.otherUserId,
              },
            } as FavoriteContact;
          })
        );
        setContacts(withProfiles);
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 8,
        py: 4,
      }}
    >
      <BackButton onClick={() => navigate("/dashboard")} />

      <Container maxWidth="md">
        <Toolbar />

        <Typography variant="h4" gutterBottom align="center">
          Starred Contacts
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ mb: 4 }}
        >
          All people you&apos;ve favorited, across every event.
        </Typography>

        {loading && (
          <Typography align="center" sx={{ mb: 2 }}>
            Loading favorites…
          </Typography>
        )}

        {contacts.length === 0 && !loading ? (
          <Typography align="center" color="text.secondary">
            You haven&apos;t favorited anyone yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {contacts.map((c) => (
              <Card key={c.id}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      src={c.profile.photoURL}
                      sx={{ width: 52, height: 52 }}
                    >
                      {c.profile.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {c.profile.name}
                      </Typography>
                      {c.profile.email && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {c.profile.email}
                        </Typography>
                      )}
                      <Chip
                        icon={<StarIcon />}
                        label={`Event: ${c.eventCode}`}
                        size="small"
                        color="warning"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    component={Link}
                    to={`/profile/view/${c.profile.slug}?eventCode=${c.eventCode}&back=contacts`}
                  >
                    View Profile
                  </Button>
                  <Button
                    size="small"
                    component={Link}
                    to={`/events/${c.eventCode}`}
                  >
                    Go to Event
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
