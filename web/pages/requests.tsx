import { ReactElement, useEffect } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import RequestsPageV2 from "../components/templates/requests/requestsPageV2";
import { SortDirection } from "../services/lib/sorts/requests/sorts";

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
      organizationLayoutAvailable={true}
    />
  );
};

RequestsV2.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default RequestsV2;
