import { Helmet, HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router";

import AuthLayout from "@/components/layout/auth/authLayout";
import DashboardPage from "@/components/templates/dashboard/dashboardPage";
import ExperimentsPage from "@/components/templates/prompts/experiments/table/experimentsPage";
import { ExperimentTable } from "@/components/templates/prompts/experiments/table/ExperimentTable";
import PromptFromPlaygroundShell from "@/components/templates/prompts/PromptFromPlaygroundShell";
import PromptFromRequestShell from "@/components/templates/prompts/PromptFromRequestShell";
import PromptIdShell from "@/components/templates/prompts/PromptIdShell";
import PromptsPage from "@/components/templates/prompts/promptsPage";
import PropertiesPage from "@/components/templates/properties/propertiesPage";
import RequestsPageShell from "@/components/templates/requests/RequestsPageShell";
import SessionDetailShell from "@/components/templates/sessions/SessionDetailShell";
import SessionsPageShell from "@/components/templates/sessions/SessionsPageShell";
import UserIdPage from "@/components/templates/users/id/userIdPage";
import UsersPageV2 from "@/components/templates/users/usersPage";
import EvaluatorsList from "./templates/evals/EvaluatorsList";
import EvaluatorsNewShell from "./templates/evals/EvaluatorsNewShell";
import EvaluatorDetailShell from "./templates/evals/EvaluatorDetailShell";

type RouteConfig = {
  path: string;
  element: React.ReactNode;
  title: string;
};

const routes: RouteConfig[] = [
  {
    path: "/dashboard",
    element: <DashboardPage />,
    title: "Dashboard | Helicone",
  },
  {
    path: "/requests",
    element: <RequestsPageShell />,
    title: "Requests | Helicone",
  },
  {
    path: "/sessions",
    element: <SessionsPageShell />,
    title: "Sessions | Helicone",
  },
  {
    path: "/sessions/:name/:session_id",
    element: <SessionDetailShell />,
    title: "Sessions | Helicone",
  },
  {
    path: "/properties",
    element: <PropertiesPage />,
    title: "Properties | Helicone",
  },
  {
    path: "/properties/:key",
    element: <PropertiesPage />,
    title: "Properties | Helicone",
  },
  {
    path: "/users",
    element: <UsersPageV2 />,
    title: "Users | Helicone",
  },
  {
    path: "/users/:id",
    element: <UserIdPage />,
    title: "Users | Helicone",
  },
  {
    path: "/prompts",
    element: <PromptsPage />,
    title: "Prompts | Helicone",
  },
  {
    path: "/prompts/fromRequest/:requestId",
    element: <PromptFromRequestShell />,
    title: "Prompts | Helicone",
  },
  {
    path: "/prompts/fromPlayground/:promptId",
    element: <PromptFromPlaygroundShell />,
    title: "Prompts | Helicone",
  },
  {
    path: "/prompts/:promptId",
    element: <PromptIdShell />,
    title: "Prompts | Helicone",
  },
  {
    path: "/experiments",
    element: <ExperimentsPage />,
    title: "Experiments | Helicone",
  },
  {
    path: "/experiments/:experimentId",
    element: <ExperimentTable />,
    title: "Experiments | Helicone",
  },
  {
    path: "/evaluators",
    element: <EvaluatorsList />,
    title: "Evaluators | Helicone",
  },
  {
    path: "/evaluators/new",
    element: <EvaluatorsNewShell />,
    title: "Create Evaluator | Helicone",
  },
  {
    path: "/evaluators/:id",
    element: <EvaluatorDetailShell />,
    title: "Edit Evaluator | Helicone",
  },
];

export default function StaticShell() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthLayout>
          <Routes>
            {routes.map(({ path, element, title }) => (
              <Route
                key={path}
                path={path}
                element={
                  <>
                    <Helmet>
                      <title>{title}</title>
                    </Helmet>
                    {element}
                  </>
                }
              />
            ))}
          </Routes>
        </AuthLayout>
      </BrowserRouter>
    </HelmetProvider>
  );
}
