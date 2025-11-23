// src/styles/animations.ts
import { keyframes } from "@emotion/react";

// Smooth fade + slide up
export const fadeUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(18px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Soft scale pop (good for cards, avatars)
export const popIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.92);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

// Floating effect (for FAB / buttons)
export const float = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0); }
`;

// Fade in from left (nice for back buttons / chips)
export const slideLeft = keyframes`
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
`;

// Fade in from right
export const slideRight = keyframes`
  0% {
    opacity: 0;
    transform: translateX(20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
`;
