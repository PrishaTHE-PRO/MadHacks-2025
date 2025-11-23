import { IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function AnimatedBackArrow() {
  const navigate = useNavigate();

  const handleBack = () => {
    // animation then navigation
    setTimeout(() => navigate(-1), 180);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <IconButton
          onClick={handleBack}
          component={motion.button}
          whileTap={{ x: -25 }}  // ← SLIDE LEFT when clicked
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 10,
          }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>
      </motion.div>
    </AnimatePresence>
  );
}
