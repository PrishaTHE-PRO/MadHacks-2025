// src/pages/LandingPage.tsx
import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";

const MotionBox = motion(Box);
const MotionTypography = motion(Typography);
const MotionDiv = motion('div');

export function LandingPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top, #1e293b, #020617)"
            : "radial-gradient(circle at top, #e0f2fe, #eff6ff)",
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
        }}
      >
        <MotionBox
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          sx={{
            width: "100%",
            borderRadius: 4,
            p: { xs: 4, md: 6 },
            boxShadow: 8,
            bgcolor: "background.paper",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* floating glow */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            sx={{
              position: "absolute",
              inset: -80,
              background:
                "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.3), transparent 60%)",
              pointerEvents: "none",
            }}
          />

          <Stack spacing={3} textAlign="center" position="relative">
            <MotionTypography
              variant="h3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              WiFi Proximity App
            </MotionTypography>

            <MotionTypography
              variant="body1"
              color="text.secondary"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Connect with people nearby at events using shared WiFi and
              real‑time profiles. No awkward introductions, just instant
              context.
            </MotionTypography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
              sx={{ mt: 1 }}
            >
              <MotionDiv whileHover={{ scale: 1.03, boxShadow: "0 12px 30px rgba(0,0,0,0.25)" }} whileTap={{ scale: 0.98 }}>
                <Button variant="contained" component={Link} to="/login">
                  Login
                </Button>
              </MotionDiv>
              <MotionDiv whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outlined" component={Link} to="/signup">
                  Sign Up
                </Button>
              </MotionDiv>
            </Stack>
          </Stack>
        </MotionBox>
      </Container>
    </Box>
  );
}
