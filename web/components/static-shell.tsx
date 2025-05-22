import { BrowserRouter, Routes, Route } from "react-router";
import DashboardPage from "@/components/templates/dashboard/dashboardPage";
import RequestsPageShell from "@/components/templates/requests/RequestsPageShell";
import AuthLayout from "./layout/auth/authLayout";
import SessionsPageShell from "./templates/sessions/SessionsPageShell";

export default function StaticShell() {
  return (
    <BrowserRouter>
      <AuthLayout>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/requests" element={<RequestsPageShell />} />
          <Route path="/sessions" element={<SessionsPageShell />} />
        </Routes>
      </AuthLayout>
    </BrowserRouter>
  );
}
