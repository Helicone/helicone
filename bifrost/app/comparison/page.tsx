import { Suspense } from "react";
import ComparisonContent from "./ComparisonContent";

function ComparisonFallback() {
  return (
    <div className="min-h-screen bg-white px-4 py-4 flex flex-col items-center">
      <div className="container mx-auto max-w-4xl pb-2 text-center">
        <div className="h-[150px] w-[150px] mx-auto bg-gray-200 animate-pulse rounded" />
      </div>
      <div className="text-center max-w-3xl mx-auto">
        <div className="h-10 bg-gray-200 animate-pulse rounded w-64 mx-auto mb-4" />
        <div className="h-6 bg-gray-200 animate-pulse rounded w-96 mx-auto mb-6" />
      </div>
    </div>
  );
}

export default function ComparisonIndexPage() {
  return (
    <Suspense fallback={<ComparisonFallback />}>
      <ComparisonContent />
    </Suspense>
  );
}
