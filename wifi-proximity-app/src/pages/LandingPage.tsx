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
const MotionDiv = motion("div");

export function LandingPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top, #1d4ed8, #020617)"
            : "radial-gradient(circle at top, #bfdbfe, #eff6ff)",
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
          {/* floating blue glow in the corner */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            sx={{
              position: "absolute",
              inset: -80,
              background:
                "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.35), transparent 60%)",
              pointerEvents: "none",
            }}
          />

          {/* SVG "water ripple" distortion filter (shader-like) */}
          <Box
            component="svg"
            sx={{ position: "absolute", width: 0, height: 0 }}
          >
            <defs>
              <filter id="ripple-distortion">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.01"
                  numOctaves={2}
                  result="noise"
                >
                  <animate
                    attributeName="baseFrequency"
                    dur="6s"
                    values="0.01;0.03;0.01"
                    repeatCount="indefinite"
                  />
                </feTurbulence>
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale={8}
                  xChannelSelector="R"
                  yChannelSelector="G"
                >
                  <animate
                    attributeName="scale"
                    dur="6s"
                    values="4;10;4"
                    repeatCount="indefinite"
                  />
                </feDisplacementMap>
              </filter>
            </defs>
          </Box>

          <Stack
            spacing={4}
            textAlign="center"
            alignItems="center"
            position="relative"
          >
            {/* Title + ripple rings wrapper */}
            <Box
              sx={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1,
              }}
            >
              {/* Outer ripple rings (subtle, go further out) */}
              <MotionBox
                aria-hidden
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0.4, 0.15, 0], scale: [1, 1.9, 2.4] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0,
                }}
                sx={{
                  position: "absolute",
                  width: 260,
                  height: 260,
                  borderRadius: "50%",
                  border: "2px solid rgba(59,130,246,0.5)",
                  boxShadow: "0 0 40px rgba(37,99,235,0.35)",
                }}
              />
              <MotionBox
                aria-hidden
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0.5, 0.2, 0], scale: [1, 1.7, 2.2] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 1,
                }}
                sx={{
                  position: "absolute",
                  width: 210,
                  height: 210,
                  borderRadius: "50%",
                  border: "2px solid rgba(59,130,246,0.35)",
                  boxShadow: "0 0 32px rgba(37,99,235,0.25)",
                }}
              />
              <MotionBox
                aria-hidden
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: [0.7, 0.3, 0], scale: [1, 1.5, 2] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 2,
                }}
                sx={{
                  position: "absolute",
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  border: "2px solid rgba(59,130,246,0.25)",
                  boxShadow: "0 0 24px rgba(37,99,235,0.2)",
                }}
              />

              {/* "Ripple" word with subtle wobble + shader distortion */}
              <MotionTypography
                variant="h1"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{
                  opacity: 1,
                  y: [0, 2, -1, 0],
                  scale: [1, 1.015, 0.99, 1],
                  rotate: [0, 0.3, -0.2, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                sx={{
                  fontFamily: "'Poppins', 'Inter', sans-serif",
                  fontWeight: 800,
                  fontSize: { xs: "3.5rem", md: "5rem" },
                  background:
                    "linear-gradient(135deg, #38bdf8 0%, #1d4ed8 50%, #0ea5e9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  filter: "url(#ripple-distortion)",
                  textShadow:
                    "0 0 16px rgba(59,130,246,0.45), 0 0 32px rgba(37,99,235,0.55)",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                Ripple
              </MotionTypography>
            </Box>

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
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      boxShadow: "0 8px 24px rgba(37, 99, 235, 0.55)",
                    },
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
                    borderColor: "primary.main",
                    color: "primary.main",
                    "&:hover": {
                      borderWidth: 2,
                      borderColor: "primary.dark",
                      backgroundColor: "rgba(59,130,246,0.05)",
                    },
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
