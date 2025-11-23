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
        {/* Back arrow */}
        <IconButton edge="start" onClick={() => navigate(-1)}>
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
