// src/components/ParallaxHeader.tsx
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxHeaderProps {
  image: string;
  height?: number;
}

export function ParallaxHeader({ image, height = 200 }: ParallaxHeaderProps) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 200], [0, -80]);

  return (
    <motion.div
      style={{
        height,
        borderRadius: "0 0 20px 20px",
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        y,
      }}
    />
  );
}
