import { BulletListItem } from "@/components/ui/bullet-list";
import { BulletList } from "@/components/ui/bullet-list";
import { Button } from "@/components/ui/button";
import React from "react";
import { H2, Lead } from "@/components/ui/typography";

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
};

export type FeaturePreviewSectionProps = {
  pageTitle: string;
  features: Feature[];
  ctaImage?: string;
  showCTA?: boolean;
  quote?: {
    prefix: string;
    highlight: string;
    suffix: string;
  };
  onStartTrial?: () => Promise<void>;
};

const FeaturePreviewSection = ({
  pageTitle,
  features,
  ctaImage,
  showCTA = true,
  quote,
  onStartTrial,
}: FeaturePreviewSectionProps) => {
  return (
    <div className=" rounded-[35.22px] p-[18px]">
      <div className=" rounded-3xl relative">
        <div className="w-[500px] mx-auto pt-10 mb-20">
          <H2 className="text-center text-[hsl(var(--foreground))] text-3xl font-medium leading-[48px] tracking-tight">
            {pageTitle}
          </H2>
        </div>

        {/* Features List */}
        <div className="w-[1092px] flex-col justify-start items-start gap-24 inline-flex mx-auto px-12">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-row items-center gap-16">
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
            <div className="mb-24 py-10 bg-[hsl(var(--primary)/0.05)] rounded-2xl flex-col justify-start items-center gap-6 flex">
              {quote && (
                <Lead className="mx-24 text-3xl tracking-tight leading-relaxed md:leading-relaxed font-medium text-[hsl(var(--muted-foreground))]">
                  {quote.prefix}{" "}
                  <span className="text-[hsl(var(--foreground))] font-semibold">
                    {quote.highlight}
                  </span>{" "}
                  {quote.suffix}
                </Lead>
              )}
              <Button
                onClick={onStartTrial}
                className="text-[hsl(var(--primary-foreground))] text-lg font-medium leading-normal tracking-normal h-[52px] px-6 py-1 bg-[hsl(var(--primary))] rounded-xl justify-center items-center gap-2.5"
                variant="action"
              >
                Start 7-day free trial
              </Button>
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

  if (media.type === "component" && media.component) {
    const Component = media.component;
    return (
      <div className="max-w-[563px]">
        <Component />
      </div>
    );
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
      className="max-w-[563px] w-full aspect-[1.81/1] rounded-[18px] border border-[hsl(var(--border))] object-cover"
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
    <div className="flex flex-col justify-between gap-8">
      <div className="flex flex-col">
        <H2 className="text-[hsl(var(--foreground))] text-2xl font-medium whitespace-pre-line">
          {title}
        </H2>
        <BulletList>
          {description.map((text, index) => (
            <BulletListItem
              className="text-[hsl(var(--muted-foreground))] font-normal"
              key={index}
            >
              {text}
            </BulletListItem>
          ))}
        </BulletList>
      </div>
      {ctaText && (
        <div className="mt-auto">
          {ctaLink ? (
            <a href={ctaLink}>
              <Button
                className="text-[hsl(var(--primary-foreground))] text-md font-medium h-[40px] px-6 py-1.5 bg-[hsl(var(--primary))] rounded-lg justify-center items-center gap-2.5"
                variant="action"
              >
                {ctaText}
              </Button>
            </a>
          ) : (
            <Button
              onClick={scrollToTop}
              className="text-[hsl(var(--primary-foreground))] text-md font-medium h-[40px] px-6 py-1.5 bg-[hsl(var(--primary))] rounded-lg justify-center items-center gap-2.5"
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

export default FeaturePreviewSection;
