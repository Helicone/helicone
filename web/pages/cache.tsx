import AuthLayout from "../components/layout/auth/authLayout";
import { GetServerSidePropsContext } from "next";
import CachePage from "../components/templates/cache/cachePage";
import { SortDirection } from "../services/lib/sorts/requests/sorts";
import { ReactElement } from "react";

interface CacheProps {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  defaultIndex: string;
}

const Cache = (props: CacheProps) => {
  const { currentPage, pageSize, sort, defaultIndex } = props;
  return (
    <>
      <CachePage
        currentPage={currentPage}
        pageSize={pageSize}
        sort={sort}
        defaultIndex={defaultIndex}
      />
    </>
  );
};

Cache.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Cache;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { page, page_size, sortKey, sortDirection, isCustomProperty, tab } =
    context.query;

  const currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 10;

  return {
    props: {
      currentPage,
      pageSize,
      sort: {
        sortKey: sortKey ? (sortKey as string) : null,
        sortDirection: sortDirection ? (sortDirection as SortDirection) : null,
        isCustomProperty: isCustomProperty === "true",
      },
      defaultIndex: tab ? tab.toString() : "0",
    },
  };
};
