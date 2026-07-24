import { BrowserRouter, Routes, Route } from "react-router-dom";

import Homepage from "./pages/Homepage";
import Dashboard from "./pages/Dashboard";
import AboutPage from "./pages/Aboutpage";
import ContactPage from "./pages/Contactpage";
import NewRegister from "./forms/NewRegister";

import Secure from "./components/Secure";
import { PermissionProvider } from "./auth/PermissionContext";
import ForbiddenPage from "./pages/ForbiddenPage";

function App() {
  return (
    <BrowserRouter>
      <PermissionProvider>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/register" element={<NewRegister />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* Protected Routes */}
        <Route element={<Secure />}>
          <Route
            path="/dashboard/*"
            element={<Dashboard />}
          />
        </Route>

      </Routes>
      </PermissionProvider>
    </BrowserRouter>
  );
}

export default App;
