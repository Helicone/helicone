import { SortDirection } from "@/services/lib/sorts/requests/sorts";
import SessionsPage from "./sessionsPage";
import { useSearchParams } from "react-router";

export default function SessionsPageShell() {
  const [searchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("page_size") || "25", 10);
  const sortKey = searchParams.get("sortKey");
  const sortDirection = searchParams.get("sortDirection");
  const isCustomProperty = searchParams.get("isCustomProperty") === "true";
  const tab = searchParams.get("tab");
  const name = searchParams.get("name");

  return (
    <SessionsPage
      currentPage={currentPage}
      pageSize={pageSize}
      sort={{
        sortKey: sortKey ? (sortKey as string) : null,
        sortDirection: sortDirection ? (sortDirection as SortDirection) : null,
        isCustomProperty,
      }}
      defaultIndex={tab ? parseInt(tab as string) : 0}
      selectedName={name ? (name as string) : undefined}
    />
  );
}
