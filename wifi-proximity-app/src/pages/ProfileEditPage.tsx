import { useState } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
} from "@mui/material";

export function ProfileEditPage() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement save profile logic (to Firestore)
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" gutterBottom>
            Edit Profile
          </Typography>

          <Box component="form" onSubmit={handleSave}>
            <Stack spacing={2}>
              <TextField
                label="Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                label="Bio"
                fullWidth
                multiline
                minRows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <TextField
                label="Interests (comma separated)"
                fullWidth
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />

              <Button type="submit" variant="contained">
                Save
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
