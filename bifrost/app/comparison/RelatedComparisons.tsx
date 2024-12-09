import Link from "next/link";
import { Card } from "@/components/ui/card";
import { providers } from "@/packages/cost/providers/mappings";

interface RelatedComparisonsProps {
  modelA: string;
  providerA: string;
  modelB: string;
  providerB: string;
}

export default function RelatedComparisons({
  modelA,
  providerA,
  modelB,
  providerB,
}: RelatedComparisonsProps) {
  const providerInfoA = providers.find(
    (p) => p.provider.toUpperCase() === providerA.toUpperCase()
  );
  const providerInfoB = providers.find(
    (p) => p.provider.toUpperCase() === providerB.toUpperCase()
  );

  const findModelFamily = (providerInfo: any, modelName: string) => {
    // Check if it's a parent model
    if (providerInfo?.modelDetails?.[modelName]) {
      return {
        parent: modelName,
        siblings: Array.from(
          new Set(providerInfo.modelDetails[modelName].matches)
        ).filter((m) => m !== modelName) as string[],
      };
    }

    // Check if it's a variant
    for (const [parentModel, details] of Object.entries<{ matches: string[] }>(
      providerInfo?.modelDetails || {}
    )) {
      if (details.matches.includes(modelName)) {
        const siblings = Array.from(new Set(details.matches)).filter(
          (m) => m !== modelName
        ) as string[];

        siblings.unshift(parentModel);

        return { parent: parentModel, siblings };
      }
    }
    return null;
  };

  const modelAFamily = findModelFamily(providerInfoA, modelA);
  const modelBFamily = findModelFamily(providerInfoB, modelB);

  const createComparisonPath = (
    model1: string,
    provider1: string,
    model2: string,
    provider2: string
  ) => {
    return `/comparison/${encodeURIComponent(model1)}-on-${encodeURIComponent(
      provider1
    )}-vs-${encodeURIComponent(model2)}-on-${encodeURIComponent(provider2)}`;
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Related Comparisons</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model A Family Comparisons */}
        {modelAFamily && (
          <div>
            <h3 className="text-lg font-medium mb-3">
              Other {modelAFamily.parent} Comparisons
            </h3>
            <div className="space-y-2">
              {/* Parent comparison if current is variant */}
              {modelA !== modelAFamily.parent && (
                <Link
                  href={createComparisonPath(
                    modelAFamily.parent,
                    providerA,
                    modelB,
                    providerB
                  )}
                  className="block text-blue-500 hover:underline"
                >
                  Compare with {modelAFamily.parent}
                </Link>
              )}
              {/* Sibling comparisons */}
              {modelAFamily.siblings
                .filter((sibling: string) => sibling !== modelA)
                .map((sibling: string) => (
                  <Link
                    key={sibling}
                    href={createComparisonPath(
                      sibling,
                      providerA,
                      modelB,
                      providerB
                    )}
                    className="block text-blue-500 hover:underline"
                  >
                    Compare with {sibling}
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Model B Family Comparisons */}
        {modelBFamily && (
          <div>
            <h3 className="text-lg font-medium mb-3">
              Other {modelBFamily.parent} Comparisons
            </h3>
            <div className="space-y-2">
              {/* Parent comparison if current is variant */}
              {modelB !== modelBFamily.parent && (
                <Link
                  href={createComparisonPath(
                    modelA,
                    providerA,
                    modelBFamily.parent,
                    providerB
                  )}
                  className="block text-blue-500 hover:underline"
                >
                  Compare with {modelBFamily.parent}
                </Link>
              )}
              {/* Sibling comparisons */}
              {modelBFamily.siblings
                .filter((sibling: string) => sibling !== modelB)
                .map((sibling: string) => (
                  <Link
                    key={sibling}
                    href={createComparisonPath(
                      modelA,
                      providerA,
                      sibling,
                      providerB
                    )}
                    className="block text-blue-500 hover:underline"
                  >
                    Compare with {sibling}
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
