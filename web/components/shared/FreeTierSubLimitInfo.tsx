import { InfoBox } from "@/components/ui/helicone/infoBox";
import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";
import { FeatureId, SubfeatureId } from "@/packages/common/features";
import { useSubfeatureLimit } from "@/hooks/useFreeTierLimit";
import { P } from "@/components/ui/typography";

interface FreeTierSubLimitInfoProps {
  feature: FeatureId;
  subfeature: SubfeatureId;
  itemCount: number;
  className?: string;
}

export function FreeTierSubLimitInfo({
  feature,
  subfeature,
  itemCount,
  className = "ml-4",
}: FreeTierSubLimitInfoProps) {
  const {
    hasFullAccess,
    hasReachedLimit,
    remainingItems,
    subfeatureConfig,
    upgradeMessage,
  } = useSubfeatureLimit(feature, subfeature, itemCount);

  // Don't show anything for users with full access or unlimited subfeatures
  if (hasFullAccess || !subfeatureConfig) return null;

  // Format the subfeature name for display (e.g., "test_cases" -> "test cases")
  const subfeatureDisplay = subfeature.replace(/_/g, " ");

  return (
    <InfoBox className={className}>
      <div className="flex flex-col gap-1">
        {hasReachedLimit ? (
          <>
            <P className="text-sm font-medium flex gap-2">
              <b>Free tier limit reached for {subfeatureDisplay}.</b>
              <ProFeatureWrapper
                featureName={subfeatureConfig.upgradeFeatureName as any}
              >
                <button className="underline">{upgradeMessage}</button>
              </ProFeatureWrapper>
            </P>
          </>
        ) : (
          <>
            <P className="text-sm font-medium flex gap-2">
              <b>
                {remainingItems} {subfeatureDisplay} remaining on free tier.
              </b>
              <ProFeatureWrapper
                featureName={subfeatureConfig.upgradeFeatureName as any}
              >
                <button className="underline">{upgradeMessage}</button>
              </ProFeatureWrapper>
            </P>
          </>
        )}
      </div>
    </InfoBox>
  );
}
