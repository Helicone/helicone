import { InfoBox } from "@/components/ui/helicone/infoBox";
import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";
import { FeatureId } from "@/lib/features";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { P } from "@/components/ui/typography";

interface FreeTierLimitInfoProps {
  feature: FeatureId;
  itemCount: number;
  className?: string;
}

export function FreeTierLimitInfo({
  feature,
  itemCount,
  className = "ml-4",
}: FreeTierLimitInfoProps) {
  const {
    hasFullAccess,
    hasReachedLimit,
    remainingItems,
    featureConfig,
    upgradeMessage,
  } = useFeatureLimit(feature, itemCount);

  // Don't show anything for users with full access or if there's no free tier config
  if (hasFullAccess || !featureConfig) return null;

  return (
    <InfoBox className={className}>
      <div className="flex flex-col gap-1">
        {hasReachedLimit ? (
          <>
            <P className="text-sm font-medium flex gap-2">
              <b>Free tier limit reached.</b>
              <ProFeatureWrapper
                featureName={featureConfig.upgradeFeatureName as any}
              >
                <button className="underline">{upgradeMessage}</button>
              </ProFeatureWrapper>
            </P>
          </>
        ) : (
          <>
            <P className="text-sm font-medium flex gap-2">
              <b>
                {remainingItems} {feature} remaining on free tier.
              </b>
              <ProFeatureWrapper
                featureName={featureConfig.upgradeFeatureName as any}
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
