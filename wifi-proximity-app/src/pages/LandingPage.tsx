import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
} from "@mui/material";

export function LandingPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3} textAlign="center">
          <Typography variant="h3" component="h1">
            WiFi Proximity App
          </Typography>
          <Typography variant="body1">
            Connect with people nearby at events using shared WiFi and real-time
            profiles.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              component={Link}
              to="/login"
            >
              Login
            </Button>
            <Button
              variant="outlined"
              component={Link}
              to="/signup"
            >
              Sign Up
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
