import { useSearchParams } from "react-router";
import RequestsPage from "@/components/templates/requests/RequestsPage";
import { SortDirection } from "@/services/lib/sorts/requests/sorts";
import { useEffect } from "react";

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

export default function RequestsPageShell() {
  const [searchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("page_size") || "25", 10);
  const sortKey = searchParams.get("sortKey");
  const sortDirection = searchParams.get("sortDirection");
  const isCustomProperty = searchParams.get("isCustomProperty") === "true";

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
    <RequestsPage
      currentPage={currentPage}
      pageSize={pageSize}
      sort={{
        sortKey: sortKey ? sortKey : null,
        sortDirection: sortDirection ? (sortDirection as SortDirection) : null,
        isCustomProperty,
      }}
      organizationLayoutAvailable={true}
    />
  );
}
