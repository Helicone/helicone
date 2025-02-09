import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import React, { useState } from "react";
import { UpgradeProDialog } from "@/components/templates/organization/plan/upgradeProDialog";

export type Feature = {
  title: string;
  media: {
    type: "video" | "image" | "component";
    src?: string;
    fallbackImage?: string;
    component?: React.ComponentType;
  };
  description: string[];
  imageAlt: string;
  isImageLeft?: boolean;
  ctaText?: string;
  ctaLink?: string;
  CustomTextComponent?: React.ComponentType;
};

export type FeaturePreviewSectionCleanProps = {
  features: Feature[];
};

export const FeaturePreviewSectionClean = ({
  features,
}: FeaturePreviewSectionCleanProps) => {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [firstFeature, ...remainingFeatures] = features;

  return (
    <div className="bg-white rounded-3xl mt-4">
      <div className="w-full flex-col justify-start items-start gap-20 inline-flex mx-auto">
        {/* First Feature */}
        <div className="w-full flex xl:flex-row items-center gap-8 flex-col md:gap-8">
          <div className="flex-1 order-1 xl:order-2">
            <FeatureText
              title={firstFeature.title}
              description={firstFeature.description}
              ctaText={firstFeature.ctaText}
              ctaLink={firstFeature.ctaLink}
              CustomTextComponent={firstFeature.CustomTextComponent}
            />
          </div>
          <div className="flex-1 order-2 xl:order-1">
            <FeatureMedia
              media={firstFeature.media}
              imageAlt={firstFeature.imageAlt}
            />
          </div>
        </div>

        {/* Everything else in Pro */}
        <div className="w-full flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-4xl font-semibold leading-[52px] tracking-tight text-[#031727]">
            <span>Everything else in</span>
            <div className="px-[18px] py-2 -translate-y-1 rotate-2 bg-[#e7f6fd] rounded-xl border-2 border-[#0ca5ea] inline-flex items-center">
              <div className="text-[#0ca5ea] text-3xl font-semibold leading-9">
                Pro
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowUpgradeDialog(true)}
            className="h-[52px] px-6 py-1.5 bg-[#0da5e8] rounded-xl flex justify-center items-center gap-2.5"
          >
            <div className="text-white text-lg font-bold leading-normal tracking-tight">
              Start 7-day free trial
            </div>
          </Button>
        </div>

        {/* Remaining Features */}
        {remainingFeatures.map((feature, index) => (
          <div
            key={index}
            className="w-full flex xl:flex-row items-center gap-8 flex-col md:gap-8"
          >
            <div
              className={`flex-1 order-1 ${
                index % 2 === 0 ? "xl:order-2" : "xl:order-1"
              }`}
            >
              <FeatureText
                title={feature.title}
                description={feature.description}
                ctaText={feature.ctaText}
                ctaLink={feature.ctaLink}
                CustomTextComponent={feature.CustomTextComponent}
              />
            </div>
            <div
              className={`flex-1 order-2 ${
                index % 2 === 0 ? "xl:order-1" : "xl:order-2"
              }`}
            >
              <FeatureMedia media={feature.media} imageAlt={feature.imageAlt} />
            </div>
          </div>
        ))}
      </div>
      <UpgradeProDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
      />
    </div>
  );
};

const FeatureMedia = ({
  media,
  imageAlt,
}: {
  media: Feature["media"];
  imageAlt: string;
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver((entries) => {
      entries[0].isIntersecting ? video.play() : video.pause();
    });

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  if (media.type === "component" && media.component) {
    const Component = media.component;
    return <Component />;
  }

  if (media.type === "video") {
    return (
      <div className="max-w-[563px] h-full aspect-video rounded-[18px]">
        <video
          ref={videoRef}
          className="w-full h-full"
          src={media.src}
          poster={media.fallbackImage}
          muted
          loop
          playsInline
        />
      </div>
    );
  }

  return (
    <img
      loading="lazy"
      className="flex-1 xl:max-w-[563px] max-w-full w-full rounded-2xl object-contain"
      src={media.src}
      alt={imageAlt}
    />
  );
};

const FeatureText = ({
  title,
  description,
  ctaText,
  ctaLink,
  CustomTextComponent,
}: {
  title: string;
  description: string[];
  ctaText?: string;
  ctaLink?: string;
  CustomTextComponent?: React.ComponentType;
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (CustomTextComponent) {
    return <CustomTextComponent />;
  }

  return (
    <div className="flex flex-col justify-between gap-8">
      <div className="flex flex-col">
        <div className="text-slate-700 text-2xl font-medium whitespace-pre-line">
          {title}
        </div>
        <ul className="mt-4 space-y-3">
          {description.map((text, index) => (
            <li key={index} className="flex gap-3 text-slate-500">
              <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0 translate-y-[0.25em]" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
      {ctaText && (
        <div className="mt-auto">
          {ctaLink ? (
            <a href={ctaLink}>
              <Button
                className="text-white text-md font-medium h-[40px] px-6 py-1.5 bg-[#0da5e8] rounded-lg justify-center items-center gap-2.5"
                variant="action"
              >
                {ctaText}
              </Button>
            </a>
          ) : (
            <Button
              onClick={scrollToTop}
              className="text-white text-md font-medium h-[40px] px-6 py-1.5 bg-[#0da5e8] rounded-lg justify-center items-center gap-2.5"
              variant="action"
            >
              {ctaText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
