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

          <Stack
            spacing={4}
            textAlign="center"
            alignItems="center"
            position="relative"
          >
            <MotionTypography
              variant="h1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              sx={{
                fontFamily: "'Poppins', 'Inter', sans-serif",
                fontWeight: 800,
                fontSize: { xs: "3.5rem", md: "5rem" },
                background: theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)"
                  : "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Ripple
            </MotionTypography>

            <MotionTypography
              variant="h5"
              color="text.secondary"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: { xs: "1.25rem", md: "1.5rem" },
                lineHeight: 1.6,
                maxWidth: "600px",
                mx: "auto",
                textAlign: "center",
              }}
            >
              Connect with people nearby at events using shared WiFi and
              real‑time profiles. No awkward introductions, just instant
              context.
            </MotionTypography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={3}
              justifyContent="center"
              sx={{ mt: 2 }}
            >
              <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="contained"
                  component={Link}
                  to="/login"
                  size="large"
                  disableRipple
                  sx={{
                    px: 5,
                    py: 1.5,
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    borderRadius: 3,
                    textTransform: "none",
                    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                      boxShadow: "0 8px 24px rgba(59, 130, 246, 0.5)",
                    }
                  }}
                >
                  Login
                </Button>
              </MotionDiv>
              <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outlined"
                  component={Link}
                  to="/signup"
                  size="large"
                  sx={{
                    px: 5,
                    py: 1.5,
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    borderRadius: 3,
                    textTransform: "none",
                    borderWidth: 2,
                    "&:hover": {
                      borderWidth: 2,
                    }
                  }}
                >
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
