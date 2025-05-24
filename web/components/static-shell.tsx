import { Helmet, HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import AuthLayout from "@/components/layout/auth/authLayout";
import DashboardPage from "@/components/templates/dashboard/dashboardPage";
import RequestsPageShell from "@/components/templates/requests/RequestsPageShell";
import SessionsPageShell from "@/components/templates/sessions/SessionsPageShell";

// Dynamically import route components
// const DashboardPage = dynamic(
//   () => import("@/components/templates/dashboard/dashboardPage"),
//   {
//     loading: () => <div>Loading...</div>,
//   }
// );

// const RequestsPageShell = dynamic(
//   () => import("@/components/templates/requests/RequestsPageShell"),
//   {
//     loading: () => <div>Loading...</div>,
//   }
// );

// const SessionsPageShell = dynamic(
//   () => import("@/components/templates/sessions/SessionsPageShell"),
//   {
//     loading: () => <div>Loading...</div>,
//   }
// );

const SessionDetailShell = dynamic(
  () => import("@/components/templates/sessions/SessionDetailShell"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const PropertiesPage = dynamic(
  () => import("@/components/templates/properties/propertiesPage"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const UsersPageV2 = dynamic(
  () => import("@/components/templates/users/usersPage"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const UserIdPage = dynamic(
  () => import("@/components/templates/users/id/userIdPage"),
  {
    loading: () => <div>Loading...</div>,
  }
);

// Prompts and Experiments group
const PromptsPage = dynamic(
  () => import("@/components/templates/prompts/promptsPage"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const PromptFromRequestShell = dynamic(
  () => import("@/components/templates/prompts/PromptFromRequestShell"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const PromptFromPlaygroundShell = dynamic(
  () => import("@/components/templates/prompts/PromptFromPlaygroundShell"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const PromptIdShell = dynamic(
  () => import("@/components/templates/prompts/PromptIdShell"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const ExperimentsPage = dynamic(
  () =>
    import("@/components/templates/prompts/experiments/table/experimentsPage"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const ExperimentTable = dynamic(
  () =>
    import("@/components/templates/prompts/experiments/table/ExperimentTable"),
  {
    loading: () => <div>Loading...</div>,
  }
);

// Evaluators and Datasets group
const EvaluatorsList = dynamic(
  () => import("./templates/evals/EvaluatorsList"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const EvaluatorsNewShell = dynamic(
  () => import("./templates/evals/EvaluatorsNewShell"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const EvaluatorDetailShell = dynamic(
  () => import("./templates/evals/EvaluatorDetailShell"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const DatasetsPageShell = dynamic(
  () => import("./templates/datasets/DatasetsPageShell"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const DatasetIdPageShell = dynamic(
  () => import("./templates/datasets/DatasetIdPageShell"),
  {
    loading: () => <div>Loading...</div>,
  }
);

// System features group
const CachePageShell = dynamic(
  () => import("./templates/cache/CachePageShell"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const RateLimitPage = dynamic(
  () => import("./templates/rateLimit/rateLimitPage"),
  {
    loading: () => <div>Loading...</div>,
  }
);

const AlertsPage = dynamic(() => import("./templates/alerts/alertsPage"), {
  loading: () => <div>Loading...</div>,
});

const WebhooksPage = dynamic(
  () => import("./templates/webhooks/webhooksPage"),
  {
    loading: () => <div>Loading...</div>,
  }
);

// Group routes by feature
const routeGroups = {
  main: [
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
  ],
  data: [
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
  ],
  prompts: [
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
      path: "/prompts/fromPlayground",
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
  ],
  evaluation: [
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
    {
      path: "/datasets",
      element: <DatasetsPageShell />,
      title: "Datasets | Helicone",
    },
    {
      path: "/datasets/:id",
      element: <DatasetIdPageShell />,
      title: "Dataset Details | Helicone",
    },
  ],
  system: [
    {
      path: "/cache",
      element: <CachePageShell />,
      title: "Cache | Helicone",
    },
    {
      path: "/rate-limit",
      element: <RateLimitPage />,
      title: "Rate Limit | Helicone",
    },
    {
      path: "/alerts",
      element: <AlertsPage />,
      title: "Alerts | Helicone",
    },
    {
      path: "/webhooks",
      element: <WebhooksPage />,
      title: "Webhooks | Helicone",
    },
  ],
};

// Preload routes based on current path
const preloadRelatedRoutes = (path: string) => {
  if (path.startsWith("/prompts")) {
    import("@/components/templates/prompts/promptsPage");
    import("@/components/templates/prompts/PromptIdShell");
  } else if (path.startsWith("/sessions")) {
    import("@/components/templates/sessions/SessionsPageShell");
    import("@/components/templates/sessions/SessionDetailShell");
  } else if (path.startsWith("/users")) {
    import("@/components/templates/users/usersPage");
    import("@/components/templates/users/id/userIdPage");
  }
};

// Route change listener component
function RouteChangeListener() {
  const location = useLocation();

  useEffect(() => {
    // Preload related routes when path changes
    preloadRelatedRoutes(location.pathname);
  }, [location.pathname]);

  return null;
}

export default function StaticShell() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthLayout>
          <RouteChangeListener />
          <Routes>
            {Object.values(routeGroups)
              .flat()
              .map(({ path, element, title }) => (
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
