import AuthLayout from "../components/layout/authLayout";

import { withAuthSSR } from "../lib/api/handlerWrappers";
import { User } from "@supabase/auth-helpers-react";
import CachePage from "../components/templates/cache/cachePage";
import { SortDirection } from "../services/lib/sorts/requests/sorts";
import { ReactElement } from "react";

interface CacheProps {
  user: User;
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
}
const Cache = (props: CacheProps) => {
  const { currentPage, pageSize, sort } = props;
  return (
    <>
      <CachePage currentPage={currentPage} pageSize={pageSize} sort={sort} />
    </>
  );
};

Cache.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Cache;

export const getServerSideProps = withAuthSSR(async (options) => {
  const { page, page_size, sortKey, sortDirection, isCustomProperty } =
    options.context.query;

  const currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 10;

  return {
    props: {
      user: options.userData.user,
      currentPage,
      pageSize,
      sort: {
        sortKey: sortKey ? (sortKey as string) : null,
        sortDirection: sortDirection ? (sortDirection as SortDirection) : null,
        isCustomProperty: isCustomProperty === "true",
      },
    },
  };
});
