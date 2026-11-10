import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthProvider";
import { ChangesProvider } from "./context/ChangesProvider";

function App() {
  return (
    <AuthProvider>
      <ChangesProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ChangesProvider>
    </AuthProvider>
  );
}

export default App;