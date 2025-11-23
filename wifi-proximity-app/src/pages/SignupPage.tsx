// src/pages/SignupPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../services/authService";
import { FirebaseError } from "firebase/app";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import { motion } from "framer-motion";

const MotionPaper = motion(Paper);

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signup(email, password);
      // TODO: save "name" into profile later
      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/email-already-in-use":
            setError(
              "This email is already registered. Please use a different email or login instead."
            );
            break;
          case "auth/weak-password":
            setError(
              "Password is too weak. Please use at least 6 characters."
            );
            break;
          case "auth/invalid-email":
            setError("Invalid email address.");
            break;
          case "auth/configuration-not-found":
          case "auth/project-not-found":
            setError(
              "Firebase is not configured properly. Please check your setup."
            );
            break;
          default:
            setError(
              `Failed to create account: ${err.code}. Please check the console for details.`
            );
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="xs">
        <MotionPaper
          elevation={6}
          sx={{ p: 4, borderRadius: 3 }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.4 }}
        >
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            align="center"
          >
            Sign Up
          </Typography>

          {error && (
            <Typography
              color="error"
              variant="body2"
              sx={{ mb: 2, textAlign: "center" }}
            >
              {error}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSignup}>
            <Stack spacing={2}>
              <TextField
                label="Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                inputProps={{ minLength: 6 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </Button>
            </Stack>
          </Box>

          <Typography
            variant="body2"
            sx={{ mt: 2, textAlign: "center" }}
          >
            Already have an account? <Link to="/login">Login</Link>
          </Typography>
        </MotionPaper>
      </Container>
    </Box>
  );
}
