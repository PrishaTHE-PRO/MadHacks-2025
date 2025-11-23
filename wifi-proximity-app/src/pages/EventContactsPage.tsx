// src/pages/EventContactsPage.tsx
import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { getInteractionsForEvent } from "../services/eventService";
import { getProfileByIdOrSlug } from "../services/profileService";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Stack,
  Avatar,
  Toolbar,
} from "@mui/material";
import { motion } from "framer-motion";
import { BackButton } from "../components/BackButton";

interface ContactProfile {
  name: string;
  email?: string;
  photoURL?: string;
  slug: string;
}

interface Contact {
  id: string;
  otherUserId: string;      // Firebase UID of the other person
  otherUserSlug?: string;   // stored in interaction (optional)
  note?: string;
  createdAt: any;
  profile: ContactProfile;
}

const MotionCard = motion(Card);

export function EventContactsPage() {
  const { eventCode } = useParams<{ eventCode: string }>();
  const { user } = useContext(AuthContext);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (user && eventCode) {
      getInteractionsForEvent(user.uid, eventCode).then(async (interactions) => {
        const contactsWithProfiles = await Promise.all(
          interactions.map(async (interaction: any) => {
            const profile: any = await getProfileByIdOrSlug(interaction.otherUserId);

            if (profile) {
              return {
                ...interaction,
                profile: {
                  name: profile.name || "Unknown User",
                  email: profile.email || "",
                  photoURL: profile.photoURL || "",
                  slug: profile.slug || interaction.otherUserId,
                },
              };
            }

            // fallback if no profile found
            return {
              ...interaction,
              profile: {
                name: "Unknown User",
                slug: interaction.otherUserId,
              },
            };
          })
        );
        setContacts(contactsWithProfiles);
      });
    }
  }, [user, eventCode]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 8,
        py: 4,
      }}
    >
      {/* Back arrow (default: navigate(-1)) */}
      <BackButton />

      <Container maxWidth="md">
        {/* spacer for any fixed app bar */}
        <Toolbar />

        <Typography variant="h4" gutterBottom align="center">
          Event Contacts
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ mb: 4 }}
        >
          Event Code: <strong>{eventCode}</strong>
        </Typography>

        {contacts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              No contacts yet. Use the &quot;Find Nearby&quot; feature to meet
              people at this event!
            </Typography>
            <Button
              component={Link}
              to={`/nearby/${eventCode}`}
              variant="contained"
              sx={{ mt: 2 }}
            >
              Find Nearby People
            </Button>
          </Paper>
        ) : (
          <Stack spacing={2}>-
            {contacts.map((contact) => (
              <Card
                key={contact.id}
                sx={{ boxShadow: "0 6px 18px rgba(16,24,40,0.06)" }}
              >
                <CardContent>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 2 }}
                  >
                    <Avatar
                      src={contact.profile.photoURL}
                      sx={{ width: 56, height: 56 }}
                    >
                      {contact.profile.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          wordBreak: "break-word",
                          fontWeight: 700,
                          textShadow:
                            "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                      >
                        {contact.profile.name}
                      </Typography>
                      {contact.profile.email && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            wordBreak: "break-word",
                            textShadow:
                              "0 1px 2px rgba(0,0,0,0.03)",
                          }}
                        >
                          {contact.profile.email}
                        </Typography>
                      )}
                      {contact.note && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontStyle: "italic",
                            wordBreak: "break-word",
                            textShadow:
                              "0 1px 2px rgba(0,0,0,0.02)",
                          }}
                        >
                          {contact.note}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    component={Link}
                    to={`/profile/view/${contact.profile.slug}?eventCode=${eventCode}&back=contacts`}
                  >
                    View Profile
                  </Button>
                </CardActions>
              </MotionCard>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
}