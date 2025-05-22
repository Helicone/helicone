import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "@/components/templates/dashboard/dashboardPage";
import RequestsPageShell from "@/components/templates/requests/RequestsPageShell";
import AuthLayout from "./layout/auth/authLayout";

export default function StaticShell() {
  return (
    <BrowserRouter>
      <AuthLayout>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/requests" element={<RequestsPageShell />} />
        </Routes>
      </AuthLayout>
    </BrowserRouter>
  );
}
