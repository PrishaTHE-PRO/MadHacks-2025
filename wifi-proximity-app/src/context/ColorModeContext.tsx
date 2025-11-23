import { createContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import type { PaletteMode } from "@mui/material";

interface ColorModeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextType>({
  mode: "light",
  toggleColorMode: () => {},
});

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>("light");

  const toggleColorMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const colorModeContextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "light" ? "#2563eb" : "#3b82f6",
            light: mode === "light" ? "#60a5fa" : "#93c5fd",
            dark: mode === "light" ? "#1e40af" : "#1d4ed8",
          },
          secondary: {
            main: mode === "light" ? "#7c3aed" : "#a78bfa",
            light: mode === "light" ? "#a78bfa" : "#c4b5fd",
            dark: mode === "light" ? "#5b21b6" : "#6d28d9",
          },
          success: {
            main: mode === "light" ? "#059669" : "#10b981",
          },
          background: {
            default: mode === "light" ? "#f8fafc" : "#0f172a",
            paper: mode === "light" ? "#ffffff" : "#1e293b",
          },
        },
        typography: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
          h1: {
            fontFamily: "'Poppins', 'Inter', sans-serif",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          },
          h2: {
            fontFamily: "'Poppins', 'Inter', sans-serif",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          },
          h3: {
            fontFamily: "'Poppins', 'Inter', sans-serif",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          },
          h4: {
            fontFamily: "'Poppins', 'Inter', sans-serif",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          },
          h5: {
            fontFamily: "'Poppins', 'Inter', sans-serif",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          },
          h6: {
            fontFamily: "'Poppins', 'Inter', sans-serif",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          },
          body1: {
            letterSpacing: "-0.01em",
            lineHeight: 1.7,
          },
          body2: {
            letterSpacing: "-0.01em",
            lineHeight: 1.6,
          },
          button: {
            textTransform: "none",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          },
        },
        shape: {
          borderRadius: 12,
        },
        shadows: [
          "none",
          "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        ],
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                padding: "10px 24px",
                fontSize: "0.95rem",
                boxShadow: "none",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 4px 12px 0 rgb(0 0 0 / 0.15)",
                  transform: "translateY(-1px)",
                },
              },
              contained: {
                fontWeight: 600,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: mode === "light"
                  ? "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
                  : "0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)",
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                "& .MuiOutlinedInput-root": {
                  borderRadius: 10,
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 500,
                borderRadius: 8,
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorModeContextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
