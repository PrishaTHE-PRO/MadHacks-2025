// src/components/SlideList.tsx
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface SlideListProps {
  children: ReactNode;
  index: number;
}

export function SlideList({ children, index }: SlideListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.4,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
