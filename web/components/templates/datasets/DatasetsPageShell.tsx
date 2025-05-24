import { useSearchParams } from "react-router";
import DatasetsPage from "./datasetsPage";
import { SortDirection } from "@/services/lib/sorts/requests/sorts";

const DatasetsPageShell = () => {
  const [searchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("page_size") || "10", 10);
  const sortKey = searchParams.get("sortKey");
  const sortDirection = searchParams.get(
    "sortDirection"
  ) as SortDirection | null;
  const isCustomProperty = searchParams.get("isCustomProperty") === "true";
  const tab = searchParams.get("tab");

  return (
    <DatasetsPage
      currentPage={currentPage}
      pageSize={pageSize}
      sort={{
        sortKey,
        sortDirection,
        isCustomProperty,
      }}
      defaultIndex={tab ? parseInt(tab) : 0}
    />
  );
};

export default DatasetsPageShell;
