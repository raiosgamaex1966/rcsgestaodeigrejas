import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { GamificationProvider } from "./contexts/GamificationContext.tsx";
import { BibleVersionProvider } from "./contexts/BibleVersionContext.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <GamificationProvider>
          <BibleVersionProvider>
            <App />
          </BibleVersionProvider>
        </GamificationProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);
