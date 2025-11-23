import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/authService";
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

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential":
            setError("Invalid email or password. Please try again.");
            break;
          case "auth/invalid-email":
            setError("Invalid email address.");
            break;
          case "auth/user-disabled":
            setError("This account has been disabled.");
            break;
          case "auth/configuration-not-found":
          case "auth/project-not-found":
            setError(
              "Firebase is not configured properly. Please check your setup."
            );
            break;
          default:
            setError(
              `Failed to login: ${err.code}. Please try again or check the console.`
            );
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Login
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

          <Box component="form" onSubmit={handleLogin}>
            <Stack spacing={2}>
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
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </Stack>
          </Box>

          <Typography
            variant="body2"
            sx={{ mt: 2, textAlign: "center" }}
          >
            Don&apos;t have an account?{" "}
            <Link to="/signup">Sign up</Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
