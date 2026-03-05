
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { StarknetProvider } from "./starknet/StarknetProvider";
import { DojoProvider } from "./components/DojoContext";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
      <StarknetProvider>
        <DojoProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </DojoProvider>
      </StarknetProvider>
    </QueryClientProvider>
);