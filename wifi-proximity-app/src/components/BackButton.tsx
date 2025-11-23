// src/components/BackButton.tsx
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { Box, IconButton, useTheme } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { motion } from "framer-motion";

const MotionIconButton = motion(IconButton);

type BackButtonProps = {
  onClick?: () => void;
};

export const BackButton: FC<BackButtonProps> = ({ onClick }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // default: go back one page
      navigate(-1);
    }
  };

  return (
      <Box
        sx={{
          position: "fixed",
          top: 30,
          left: 15,
          zIndex: 2000,
        }}
      >
      <MotionIconButton
        onClick={handleClick}
        sx={{
          bgcolor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255,255,255,0.95)",
          color: isDark ? "grey.100" : "text.primary",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
          boxShadow: 2,
          "&:hover": {
            bgcolor: isDark ? "rgba(51, 65, 85, 0.95)" : "grey.100"
          },
        }}
        aria-label="Back"
        // little idle scoot + smooth entrance
        initial={{ opacity: 0, x: -8, scale: 0.9 }}
        animate={{
          opacity: 1,
          x: [0, 4, 0],
          scale: 1,
        }}
        transition={{
          opacity: { duration: 0.25 },
          scale: { duration: 0.25 },
          x: { duration: 1.4, repeat: Infinity, repeatType: "reverse", delay: 0.6 },
        }}
        // tap: swipe left
        whileTap={{ x: -18, opacity: 0.7, scale: 0.95 }}
      >
        <ArrowBackIcon />
      </MotionIconButton>
    </Box>
  );
};
