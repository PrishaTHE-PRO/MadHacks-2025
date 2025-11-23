import { IconButton, useTheme } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

export function BackButton() {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <IconButton
      onClick={() => navigate(-1)}
      sx={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 999,
        backgroundColor: theme.palette.background.paper,
        boxShadow: 3,
        borderRadius: "50%",
        width: 48,
        height: 48,
        "&:hover": {
          backgroundColor:
            theme.palette.mode === "light"
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        },
      }}
    >
      <ArrowBackIcon />
    </IconButton>
  );
}
