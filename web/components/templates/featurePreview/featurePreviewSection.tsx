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
  ctaImage: _ctaImage,
  showCTA = true,
  quote,
  onStartTrial,
}: FeaturePreviewSectionProps) => {
  return (
    <div className="rounded-[35.22px] p-[18px]">
      <div className="relative rounded-3xl">
        <div className="mx-auto mb-20 w-[500px] pt-10">
          <H2 className="text-center text-3xl font-medium leading-[48px] tracking-tight text-[hsl(var(--foreground))]">
            {pageTitle}
          </H2>
        </div>

        {/* Features List */}
        <div className="mx-auto inline-flex w-[1092px] flex-col items-start justify-start gap-24 px-12">
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
            <div className="mb-24 flex flex-col items-center justify-start gap-6 rounded-2xl bg-[hsl(var(--primary)/0.05)] py-10">
              {quote && (
                <Lead className="mx-24 text-3xl font-medium leading-relaxed tracking-tight text-[hsl(var(--muted-foreground))] md:leading-relaxed">
                  {quote.prefix}{" "}
                  <span className="font-semibold text-[hsl(var(--foreground))]">
                    {quote.highlight}
                  </span>{" "}
                  {quote.suffix}
                </Lead>
              )}
              <Button
                onClick={onStartTrial}
                className="h-[52px] items-center justify-center gap-2.5 rounded-xl bg-[hsl(var(--primary))] px-6 py-1 text-lg font-medium leading-normal tracking-normal text-[hsl(var(--primary-foreground))]"
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
      <div className="aspect-video h-full max-w-[563px] rounded-[18px]">
        <video
          ref={videoRef}
          className="h-full w-full"
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      loading="lazy"
      className="aspect-[1.81/1] w-full max-w-[563px] rounded-[18px] border border-[hsl(var(--border))] object-cover"
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
        <H2 className="whitespace-pre-line text-2xl font-medium text-[hsl(var(--foreground))]">
          {title}
        </H2>
        <BulletList>
          {description.map((text, index) => (
            <BulletListItem
              className="font-normal text-[hsl(var(--muted-foreground))]"
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
                className="text-md h-[40px] items-center justify-center gap-2.5 rounded-lg bg-[hsl(var(--primary))] px-6 py-1.5 font-medium text-[hsl(var(--primary-foreground))]"
                variant="action"
              >
                {ctaText}
              </Button>
            </a>
          ) : (
            <Button
              onClick={scrollToTop}
              className="text-md h-[40px] items-center justify-center gap-2.5 rounded-lg bg-[hsl(var(--primary))] px-6 py-1.5 font-medium text-[hsl(var(--primary-foreground))]"
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
