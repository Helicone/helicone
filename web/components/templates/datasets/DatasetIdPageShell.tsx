import { useParams, useSearchParams } from "react-router";
import DatasetIdPage from "./datasetsIdPage";

const DatasetIdPageShell = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("page_size") || "25", 10);

  return (
    <DatasetIdPage
      id={id as string}
      currentPage={currentPage}
      pageSize={pageSize}
    />
  );
};

export default DatasetIdPageShell;
