// import AuthLayout from "@/components/layout/auth/authLayout";
// import DashboardPage from "@/components/templates/dashboard/dashboardPage";
// import RequestsPageShell from "@/components/templates/requests/RequestsPageShell";
// import { BrowserRouter, Routes, Route } from "react-router";
import dynamic from "next/dynamic";

const StaticShell = dynamic(() => import("@/components/static-shell"), {
  ssr: false,
});

export default StaticShell;

// export default function StaticShell() {
//   return (
//     <BrowserRouter>
//       <AuthLayout>
//         <Routes>
//           <Route path="/requests" element={<RequestsPageShell />} />
//           <Route path="/dashboard" element={<DashboardPage />} />
//         </Routes>
//       </AuthLayout>
//     </BrowserRouter>
//   );
// }
