import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { getInteractionsForEvent } from "../services/eventService";
import { getProfileBySlug } from "../services/profileService";
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
  CircularProgress,
  Toolbar,
} from "@mui/material";

interface Contact {
  id: string;
  otherUserId: string;
  note?: string;
  createdAt: any;
  profile?: {
    name: string;
    email?: string;
    photoURL?: string;
    slug: string;
  };
}

export function EventContactsPage() {
  const { eventCode } = useParams<{ eventCode: string }>();
  const { user } = useContext(AuthContext);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && eventCode) {
      getInteractionsForEvent(user.uid, eventCode).then(async (interactions) => {
        // Fetch profile data for each contact
        const contactsWithProfiles = await Promise.all(
          interactions.map(async (interaction: any) => {
            const profile = await getProfileBySlug(interaction.otherUserId);
            return {
              ...interaction,
              profile: profile || { name: "Unknown User", slug: interaction.otherUserId },
            };
          })
        );
        setContacts(contactsWithProfiles);
        setLoading(false);
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
      <Container maxWidth="md">
        {/* spacer so fixed AppBar doesn't overlap content */}
        <Toolbar />

        <Typography variant="h4" gutterBottom align="center">
          Event Contacts
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Event Code: <strong>{eventCode}</strong>
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : contacts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              No contacts yet. Use the &quot;Find Nearby&quot; feature to meet people at this event!
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
            {contacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      src={contact.profile?.photoURL}
                      sx={{ width: 56, height: 56 }}
                    >
                      {contact.profile?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ wordBreak: "break-word" }}>
                        {contact.profile?.name}
                      </Typography>
                      {contact.profile?.email && (
                        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                          {contact.profile.email}
                        </Typography>
                      )}
                      {contact.note && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", wordBreak: "break-word" }}>
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
                    to={`/profile/view/${contact.profile?.slug}?eventCode=${eventCode}&back=contacts`}
                  >
                    View Profile
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
