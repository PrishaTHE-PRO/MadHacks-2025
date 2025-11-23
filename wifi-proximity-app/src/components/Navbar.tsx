import { AppBar, Toolbar, IconButton, Typography, Box } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useLocation } from "react-router-dom";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Paths where we DON'T want a navbar
  const hiddenOn = ["/"]; // Landing page only

  if (hiddenOn.includes(location.pathname)) {
    return null;
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{ bgcolor: "background.paper", color: "text.primary" }}
    >
      <Toolbar>
        {/* Back arrow: prefer an explicit target for list-like pages so back doesn't return
            to an edit form. Fall back to history.back when no explicit target exists. */}
        <IconButton
          edge="start"
          onClick={() => {
            const path = location.pathname;
            // If we're on a profile-related page, go to dashboard instead of history.back
            if (path.startsWith("/profile") || path.startsWith("/events") || path.startsWith("/nearby")) {
              navigate("/dashboard");
              return;
            }
            navigate(-1);
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        {/* Small app title */}
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          WiFi Proximity
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
