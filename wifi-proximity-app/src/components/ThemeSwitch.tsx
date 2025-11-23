// src/components/ThemeSwitch.tsx
import { useContext } from "react";
import { ColorModeContext } from "../context/ColorModeContext";
import "./ThemeSwitch.css";

export function ThemeSwitch() {
  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const isDark = mode === "dark";

  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={isDark}
        onChange={toggleColorMode}
      />
      <span className="slider">
        <span className="star star_1"></span>
        <span className="star star_2"></span>
        <span className="star star_3"></span>
        <svg
          className="cloud"
          viewBox="0 0 512 512"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#fff"
            d="M406.5 399.1c47.6 0 86.2-38.6 86.2-86.2s-38.6-86.2-86.2-86.2c-1.9 0-3.8.1-5.6.2C390.3 165.5 338.4 128 278 128c-53.4 0-99 33.5-117.2 80.5-4.7-.5-9.5-.8-14.3-.8-61.9 0-112.1 50.2-112.1 112.1S84.6 432 146.5 432h260z"
          />
        </svg>
      </span>
    </label>
  );
}
