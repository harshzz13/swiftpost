import { Toaster } from "@/components/ui/sonner";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <ErrorBoundary>
      <ConnectionStatus />
      <AppRoutes />
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;


