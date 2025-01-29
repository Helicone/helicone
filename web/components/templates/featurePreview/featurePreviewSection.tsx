import { BulletListItem } from "@/components/ui/bullet-list";
import { BulletList } from "@/components/ui/bullet-list";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@heroicons/react/24/solid";
import React from "react";

export type Feature = {
  title: string;
  media: {
    type: "video" | "image";
    src: string;
    fallbackImage?: string;
  };
  description: string[];
  imageAlt: string;
  isImageLeft?: boolean;
  ctaText?: string;
  ctaLink?: string;
};

export type FeaturePreviewSectionProps = {
  pageTitle: string;
  features: Feature[];
  ctaImage?: string;
  showCTA?: boolean;
};

const FeaturePreviewSection = ({
  pageTitle,
  features,
  ctaImage,
  showCTA = true,
}: FeaturePreviewSectionProps) => {
  return (
    <div className="bg-[#ecf6fc] rounded-[35.22px] shadow-[14.889px_4.581px_19.088px_0px_rgba(0,0,0,0.10)] border border-white p-[18px]">
      <div className="bg-white rounded-3xl relative">
        {/* Reduced padding-top from pt-20 to pt-10 */}
        <div className="w-[500px] mx-auto pt-10 mb-20">
          <h2 className="text-center text-[#031727] text-3xl font-medium leading-[48px] tracking-tight">
            {pageTitle}
          </h2>
        </div>

        {/* Features List */}
        <div className="w-[1092px] flex-col justify-start items-start gap-24 inline-flex mx-auto px-12">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-row gap-16">
              {feature.isImageLeft ? (
                <>
                  <FeatureMedia
                    media={feature.media}
                    imageAlt={feature.imageAlt}
                  />
                  <FeatureText
                    title={feature.title}
                    description={feature.description}
                    ctaText={feature.ctaText}
                    ctaLink={feature.ctaLink}
                  />
                </>
              ) : (
                <>
                  <FeatureText
                    title={feature.title}
                    description={feature.description}
                    ctaText={feature.ctaText}
                    ctaLink={feature.ctaLink}
                  />
                  <FeatureMedia
                    media={feature.media}
                    imageAlt={feature.imageAlt}
                  />
                </>
              )}
            </div>
          ))}

          {/* Bottom CTA Section */}
          {showCTA && (
            <div className="self-stretch h-[354px] px-9 py-6 bg-[#f2f9fc] rounded-2xl border border-[#a2c1dd] flex-col justify-start items-center gap-2.5 flex">
              {ctaImage && (
                <img
                  className="w-[858px] h-[244px]"
                  src={ctaImage}
                  alt="Feature overview"
                />
              )}
              <button className="w-[210px] h-[52px] px-6 py-1.5 bg-[#0da5e8] rounded-xl justify-center items-center gap-2.5 inline-flex">
                <div className="text-white text-base font-bold leading-normal tracking-tight">
                  Start 7-day free trial
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
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

  if (media.type === "video") {
    return (
      <div className="max-w-[563px] w-full aspect-[1.81/1] rounded-[18px] border border-slate-200 overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
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
      className="max-w-[563px] w-full aspect-[1.81/1] rounded-[18px] border border-slate-200 object-cover"
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
}: {
  title: string;
  description: string[];
  ctaText?: string;
  ctaLink?: string;
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col justify-between">
      <div className="text-slate-900 text-2xl font-medium whitespace-pre-line">
        {title}
      </div>
      <BulletList>
        {description.map((text, index) => (
          <BulletListItem key={index}>{text}</BulletListItem>
        ))}
      </BulletList>
      {ctaText && (
        <div className="mt-auto">
          <Button
            onClick={scrollToTop}
            className="text-white text-md font-medium h-[40px] px-6 py-1.5 bg-[#0da5e8] rounded-lg justify-center items-center gap-2.5"
            variant="action"
          >
            {ctaText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FeaturePreviewSection;
