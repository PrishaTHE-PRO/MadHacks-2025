import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
} from "@mui/material";

export function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();

  // TODO: later load profile by slug from Firestore
  const name = "User Name";
  const bio = "User bio here";
  const interests = "Interest 1, Interest 2";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 8,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" gutterBottom>
            Profile: {slug}
          </Typography>
          <Stack spacing={1}>
            <Typography>
              <strong>Name:</strong> {name}
            </Typography>
            <Typography>
              <strong>Bio:</strong> {bio}
            </Typography>
            <Typography>
              <strong>Interests:</strong> {interests}
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

