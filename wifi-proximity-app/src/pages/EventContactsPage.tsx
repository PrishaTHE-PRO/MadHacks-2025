// src/pages/EventContactsPage.tsx
import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getInteractionsForEvent,
  updateInteraction,
  deleteInteraction,
} from "../services/eventService";
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
  TextField,
  MenuItem,
  IconButton,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DeleteIcon from "@mui/icons-material/Delete";
import NotesIcon from "@mui/icons-material/Notes";
import { BackButton } from "../components/BackButton";

interface ContactProfile {
  name: string;
  email?: string;
  photoURL?: string;
  slug: string;
}

interface Contact {
  id: string;
  otherUserId: string; // Firebase UID of the other person
  otherUserSlug?: string; // stored in interaction (optional)
  note?: string;
  favorite?: boolean;
  createdAt: any;
  eventCode?: string;
  profile: ContactProfile;
}

function getLastNameFromFull(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  return parts[parts.length - 1];
}

export function EventContactsPage() {
  const { eventCode } = useParams<{ eventCode: string }>();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>("");

  useEffect(() => {
    if (!user || !eventCode) return;

    setLoading(true);
    getInteractionsForEvent(user.uid, eventCode)
      .then(async (interactions) => {
        const contactsWithProfiles = await Promise.all(
          interactions.map(async (interaction: any) => {
            const profile: any = await getProfileByIdOrSlug(
              interaction.otherUserId
            );

            if (profile) {
              return {
                ...interaction,
                eventCode,
                profile: {
                  name: profile.name || "Unknown User",
                  email: profile.email || "",
                  photoURL: profile.photoURL || "",
                  slug: profile.slug || interaction.otherUserId,
                },
              } as Contact;
            }

            // fallback if no profile found
            return {
              ...interaction,
              eventCode,
              profile: {
                name: "Unknown User",
                slug: interaction.otherUserId,
              },
            } as Contact;
          })
        );
        setContacts(contactsWithProfiles);
      })
      .finally(() => setLoading(false));
  }, [user, eventCode]);

  const sortedContacts = [...contacts].sort((a, b) => {
    const aLast = getLastNameFromFull(a.profile.name);
    const bLast = getLastNameFromFull(b.profile.name);
    const cmp = aLast.localeCompare(bLast);
    if (cmp !== 0) return cmp;
    return (a.profile.name || "").localeCompare(b.profile.name || "");
  });

  const handleToggleFavorite = async (c: Contact) => {
    if (!user || !eventCode) return;
    const newFav = !c.favorite;

    setContacts((prev) =>
      prev.map((x) =>
        x.id === c.id ? { ...x, favorite: newFav } : x
      )
    );

    await updateInteraction({
      ownerUserId: user.uid,
      otherUserId: c.otherUserId,
      eventCode,
      favorite: newFav,
    });
  };

  const handleNoteChange = (id: string, value: string) => {
    setContacts((prev) =>
      prev.map((x) => (x.id === id ? { ...x, note: value } : x))
    );
  };

  const handleNoteSave = async (c: Contact) => {
    if (!user || !eventCode) return;
    await updateInteraction({
      ownerUserId: user.uid,
      otherUserId: c.otherUserId,
      eventCode,
      note: c.note || "",
    });
  };

  const handleDiscard = async (c: Contact) => {
    if (!user || !eventCode) return;
    const ok = window.confirm(
      `Discard contact "${c.profile.name}" from this event?`
    );
    if (!ok) return;

    await deleteInteraction({
      ownerUserId: user.uid,
      otherUserId: c.otherUserId,
      eventCode,
    });

    setContacts((prev) => prev.filter((x) => x.id !== c.id));
    if (selectedContactId === c.id) {
      setSelectedContactId("");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 8,
        py: 4,
      }}
    >
      {/* Back arrow */}
      <BackButton onClick={() => navigate("/dashboard")} />

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

        {loading && (
          <Typography align="center" sx={{ mb: 2 }}>
            Loading contacts…
          </Typography>
        )}

        {sortedContacts.length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Contacts at this event
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              label="Jump to contact"
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
            >
              {sortedContacts.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.favorite ? "⭐ " : ""}
                  {c.profile.name}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="caption" color="text.secondary">
              Sorted alphabetically by last name. ⭐ indicates favorites.
            </Typography>
          </Paper>
        )}

        {sortedContacts.length === 0 ? (
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
          <Stack spacing={2}>
            {sortedContacts.map((contact) => {
              const isSelected = contact.id === selectedContactId;
              return (
                <Card
                  key={contact.id}
                  sx={{
                    boxShadow: "0 6px 18px rgba(16,24,40,0.06)",
                    border: isSelected
                      ? "2px solid rgba(245, 158, 11, 0.7)"
                      : "1px solid rgba(148,163,184,0.2)",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 1,
                      }}
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
                      </Box>
                      <IconButton
                        onClick={() => handleToggleFavorite(contact)}
                        sx={{ ml: 1 }}
                      >
                        {contact.favorite ? (
                          <StarIcon color="warning" />
                        ) : (
                          <StarBorderIcon />
                        )}
                      </IconButton>
                    </Box>

                    {/* Note editor */}
                    <Box sx={{ mt: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <NotesIcon fontSize="small" />
                        <Typography variant="subtitle2">
                          Notes
                        </Typography>
                      </Box>
                      <TextField
                        multiline
                        minRows={2}
                        fullWidth
                        placeholder="Add notes about this person (e.g. where you met, what you discussed)..."
                        value={contact.note || ""}
                        onChange={(e) =>
                          handleNoteChange(contact.id, e.target.value)
                        }
                      />
                      <Button
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => handleNoteSave(contact)}
                      >
                        Save note
                      </Button>
                    </Box>
                  </CardContent>

                  <CardActions
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      px: 2,
                      pb: 2,
                    }}
                  >
                    <Box>
                      <Button
                        size="small"
                        component={Link}
                        to={`/profile/view/${contact.profile.slug}?eventCode=${eventCode}&back=contacts`}
                      >
                        View Profile
                      </Button>
                    </Box>

                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDiscard(contact)}
                    >
                      Discard
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
