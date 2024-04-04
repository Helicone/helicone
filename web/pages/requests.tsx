import { User } from "@supabase/auth-helpers-react";
import AuthLayout from "../components/layout/authLayout";
import RequestsPageV2 from "../components/templates/requestsV2/requestsPageV2";
import { SortDirection } from "../services/lib/sorts/requests/sorts";
import { ReactElement, useEffect } from "react";
import {
  OrganizationFilter,
  OrganizationLayout,
} from "../services/lib/organization_layout/organization_layout";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { supabaseServer } from "../lib/supabaseServer";

// Got this ugly hack from https://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node
const jsToRun = `
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child.parentNode !== this) {
      if (console) {
        console.error('Cannot remove a child from a different parent', child, this);
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  }

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) {
        console.error('Cannot insert before a reference node from a different parent', referenceNode, this);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  }
}
`;

interface RequestsV2Props {
  user: User;
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  initialRequestId: string | null;
  currentFilter: OrganizationFilter | null;
  orgLayout: OrganizationLayout | null;
}

const RequestsV2 = (props: RequestsV2Props) => {
  const {
    user,
    currentPage,
    pageSize,
    sort,
    initialRequestId,
    orgLayout,
    currentFilter,
  } = props;

  useEffect(() => {
    var observer = new MutationObserver(function (event) {
      if (document.documentElement.className.match("translated")) {
        eval(jsToRun);
      } else {
        console.log("Page untranslate");
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
      childList: false,
      characterData: false,
    });
  }, []);

  return (
    <RequestsPageV2
      currentPage={currentPage}
      pageSize={pageSize}
      sort={sort}
      initialRequestId={
        initialRequestId === null ? undefined : initialRequestId
      }
      currentFilter={currentFilter}
      organizationLayout={orgLayout}
    />
  );
};

RequestsV2.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default RequestsV2;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user, orgId },
  } = options;

  const { context } = options;

  if (!user)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  const {
    page,
    page_size,
    sortKey,
    sortDirection,
    isCustomProperty,
    requestId,
  } = context.query;

  const currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 25;

  const { data: orgLayout, error: organizationLayoutError } =
    await supabaseServer
      .from("organization_layout")
      .select("*")
      .eq("organization_id", orgId)
      .eq("type", "requests")
      .single();

  if (!orgLayout || organizationLayoutError) {
    return {
      props: {
        user: user,
        currentPage,
        pageSize,
        sort: {
          sortKey: sortKey ? (sortKey as string) : null,
          sortDirection: sortDirection
            ? (sortDirection as SortDirection)
            : null,
          isCustomProperty: isCustomProperty === "true",
        },
        initialRequestId: requestId ? (requestId as string) : null,
        currentFilter: null,
        orgLayout: orgLayout ?? null,
      },
    };
  }

  const filterId = context.query.filter as string;

  const filters: OrganizationFilter[] =
    orgLayout.filters as OrganizationFilter[];
  const layout: OrganizationLayout = {
    id: orgLayout.id,
    type: orgLayout.type,
    filters: filters,
    organization_id: orgLayout.organization_id,
  };

  const currentFilter = filters.find((x) => x.id === filterId);

  return {
    props: {
      user: user,
      currentPage,
      pageSize,
      sort: {
        sortKey: sortKey ? (sortKey as string) : null,
        sortDirection: sortDirection ? (sortDirection as SortDirection) : null,
        isCustomProperty: isCustomProperty === "true",
      },
      initialRequestId: requestId ? (requestId as string) : null,
      currentFilter: currentFilter ?? null,
      orgLayout: layout ?? null,
    },
  };
});
