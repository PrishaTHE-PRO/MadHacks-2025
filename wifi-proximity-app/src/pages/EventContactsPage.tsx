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
import { CardHeader, Divider } from "@mui/material";
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

  // "ALL" | "FAVORITES" | contact.id
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

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

  // Apply filter:
  // - "ALL"       -> everyone
  // - "FAVORITES" -> only favorite contacts
  // - contact id  -> just that one person
  const filteredContacts = (() => {
    if (selectedFilter === "ALL") return sortedContacts;
    if (selectedFilter === "FAVORITES") {
      return sortedContacts.filter((c) => c.favorite);
    }
    return sortedContacts.filter((c) => c.id === selectedFilter);
  })();

  const handleToggleFavorite = async (c: Contact) => {
    if (!user || !eventCode) return;
    const newFav = !c.favorite;

    setContacts((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, favorite: newFav } : x))
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

    // If the discarded contact was the selected filter, reset to ALL
    if (selectedFilter === c.id) {
      setSelectedFilter("ALL");
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
          <Paper
            sx={{
              p: 2,
              mb: 3,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Typography variant="subtitle1">Contacts at this event</Typography>

            <TextField
              select
              fullWidth
              size="small"
              label="Filter / jump to contact"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <MenuItem value="ALL">All contacts</MenuItem>
              <MenuItem value="FAVORITES">⭐ Favorites only</MenuItem>
              {sortedContacts.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.favorite ? "⭐ " : ""}
                  {c.profile.name}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="caption" color="text.secondary">
              Choose a person to only show their card, or select &quot;All
              contacts&quot; / &quot;⭐ Favorites only&quot;.
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
            {filteredContacts.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No contacts match this filter.
                </Typography>
              </Paper>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected =
                  selectedFilter !== "ALL" &&
                  selectedFilter !== "FAVORITES" &&
                  contact.id === selectedFilter;

                return (
                  <Card
                    key={contact.id}
                    sx={{
                      borderRadius: 3,
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                      border: isSelected
                        ? "2px solid rgba(59, 130, 246, 0.7)"
                        : "1px solid rgba(148,163,184,0.25)",
                      transition:
                        "transform 0.2s ease, box-shadow 0.2s ease, border 0.2s",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 16px 40px rgba(15, 23, 42, 0.14)",
                      },
                    }}
                  >
                    {/* Header: avatar, name, email, star */}
                    <CardHeader
                      avatar={
                        <Avatar
                          src={contact.profile.photoURL}
                          sx={{ width: 56, height: 56 }}
                        >
                          {contact.profile.name?.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      title={
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            wordBreak: "break-word",
                          }}
                        >
                          {contact.profile.name}
                        </Typography>
                      }
                      subheader={
                        contact.profile.email && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ wordBreak: "break-word" }}
                          >
                            {contact.profile.email}
                          </Typography>
                        )
                      }
                      action={
                        <IconButton onClick={() => handleToggleFavorite(contact)}>
                          {contact.favorite ? (
                            <StarIcon color="warning" />
                          ) : (
                            <StarBorderIcon />
                          )}
                        </IconButton>
                      }
                      sx={{ pb: 0.5 }}
                    />

                    <Divider sx={{ mx: 2, my: 1.5 }} />

                    <CardContent sx={{ pt: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.75,
                        }}
                      >
                        <NotesIcon fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
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
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: "rgba(248,250,252,0.9)",
                          },
                        }}
                      />

                      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                        <Button size="small" onClick={() => handleNoteSave(contact)}>
                          Save note
                        </Button>
                      </Box>
                    </CardContent>

                    <CardActions
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        px: 2.5,
                        pb: 2.5,
                      }}
                    >
                      <Button
                        size="small"
                        component={Link}
                        to={`/profile/view/${contact.profile.slug}?eventCode=${eventCode}&back=contacts`}
                      >
                        View Profile
                      </Button>

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
              })
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
}