import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { AppThemeProvider } from "./context/ColorModeContext";

import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  <BrowserRouter>
    <AppThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </AppThemeProvider>
  </BrowserRouter>
);
