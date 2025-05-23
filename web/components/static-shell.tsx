import { BrowserRouter, Routes, Route } from "react-router";
import DashboardPage from "@/components/templates/dashboard/dashboardPage";
import RequestsPageShell from "@/components/templates/requests/RequestsPageShell";
import AuthLayout from "./layout/auth/authLayout";
import SessionsPageShell from "./templates/sessions/SessionsPageShell";
import SessionDetailShell from "./templates/sessions/SessionDetailShell";
import PropertiesPage from "./templates/properties/propertiesPage";
import UsersPageV2 from "./templates/users/usersPage";
import UserIdPage from "./templates/users/id/userIdPage";
import PromptsPage from "./templates/prompts/promptsPage";
import PromptIdShell from "./templates/prompts/PromptIdShell";
import PromptFromRequestShell from "./templates/prompts/PromptFromRequestShell";
import PromptFromPlaygroundShell from "./templates/prompts/PromptFromPlaygroundShell";
import ExperimentsPage from "./templates/prompts/experiments/table/experimentsPage";

export default function StaticShell() {
  return (
    <BrowserRouter>
      <AuthLayout>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/requests" element={<RequestsPageShell />} />
          <Route path="/sessions" element={<SessionsPageShell />} />
          <Route
            path="/sessions/:name/:session_id"
            element={<SessionDetailShell />}
          />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:key" element={<PropertiesPage />} />
          <Route path="/users" element={<UsersPageV2 />} />
          <Route path="/users/:id" element={<UserIdPage />} />
          <Route path="/prompts" element={<PromptsPage />} />
          <Route
            path="/prompts/fromRequest/:requestId"
            element={<PromptFromRequestShell />}
          />
          <Route
            path="/prompts/fromPlayground/:promptId"
            element={<PromptFromPlaygroundShell />}
          />
          <Route path="/prompts/:promptId" element={<PromptIdShell />} />
          <Route path="/experiments" element={<ExperimentsPage />} />
        </Routes>
      </AuthLayout>
    </BrowserRouter>
  );
}
