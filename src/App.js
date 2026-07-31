import React from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";
import AdminLayout from "./pages/AdminLayout";
import AdminCustomers from "./pages/AdminCustomers";
import AdminWheelSettings from "./pages/AdminWheelSettings";
import AdminSpinResults from "./pages/AdminSpinResults";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/customers" replace />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="wheel-settings" element={<AdminWheelSettings />} />
          <Route path="spin-results" element={<AdminSpinResults />} />
        </Route>

        <Route path="*" element={<Navigate to="/customers" replace />} />
      </Routes>
    </BrowserRouter>
  );
}