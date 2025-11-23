import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Button,
  IconButton,
} from "@mui/material";
import { useContext } from "react";
import { ColorModeContext } from "../context/ColorModeContext";
import { useTheme } from "@mui/material/styles";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

export function DashboardPage() {
  const { toggleColorMode } = useContext(ColorModeContext);
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 8,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="md">
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={3}
          >
            <Typography variant="h5">Dashboard</Typography>
            <IconButton onClick={toggleColorMode}>
              {theme.palette.mode === "dark" ? (
                <LightModeIcon />
              ) : (
                <DarkModeIcon />
              )}
            </IconButton>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="body1">
              Welcome to your dashboard!
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                component={Link}
                to="/profile/me"
              >
                My Profile
              </Button>
              <Button
                variant="outlined"
                component={Link}
                to="/profile/edit"
              >
                Edit Profile
              </Button>
              <Button
                variant="outlined"
                component={Link}
                to="/events"
              >
                Events
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
