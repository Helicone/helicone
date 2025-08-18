import { GetServerSidePropsContext } from "next";
import { ReactElement, useEffect } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import RequestsPage from "../components/templates/requests/RequestsPage";
import { SortDirection } from "../services/lib/sorts/requests/sorts";
import { logger } from "@/lib/telemetry/logger";

// Got this ugly hack from https://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node
const jsToRun = `
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child.parentNode !== this) {
      if (console) {
        logger.error({ child: child.toString(), parent: this.toString() }, 'Cannot remove a child from a different parent');
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  }

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) {
        logger.error({ referenceNode: referenceNode.toString(), parent: this.toString() }, 'Cannot insert before a reference node from a different parent');
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  }
}
`;

interface RequestsV2Props {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  initialRequestId: string | null;
}

const RequestsV2 = (props: RequestsV2Props) => {
  const { currentPage, pageSize, sort, initialRequestId } = props;

  useEffect(() => {
    var observer = new MutationObserver(function () {
      if (document.documentElement.className.match("translated")) {
        eval(jsToRun);
      } else {
        logger.info("Page untranslate");
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
    <RequestsPage
      currentPage={currentPage}
      pageSize={pageSize}
      sort={sort}
      initialRequestId={
        initialRequestId === null ? undefined : initialRequestId
      }
      organizationLayoutAvailable={true}
    />
  );
};

RequestsV2.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default RequestsV2;

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
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

  return {
    props: {
      currentPage,
      pageSize,
      sort: {
        sortKey: sortKey ? (sortKey as string) : null,
        sortDirection: sortDirection ? (sortDirection as SortDirection) : null,
        isCustomProperty: isCustomProperty === "true",
      },
      initialRequestId: requestId ? (requestId as string) : null,
    },
  };
};
