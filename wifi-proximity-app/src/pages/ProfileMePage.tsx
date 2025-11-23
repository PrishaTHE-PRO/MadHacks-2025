import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stack,
} from "@mui/material";

export function ProfileMePage() {
  // TODO: later load actual profile data from Firestore
  const name = "User Name";
  const bio = "Your bio here";
  const interests = "Interest 1, Interest 2";

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
            My Profile
          </Typography>
          <Stack spacing={1} mb={3}>
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

          <Button
            variant="contained"
            component={Link}
            to="/profile/edit"
          >
            Edit Profile
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
