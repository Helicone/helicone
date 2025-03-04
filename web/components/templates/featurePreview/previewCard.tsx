import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useEffect } from "react";
import Link from "next/link";
import { H2, H3, H4, P, Small } from "@/components/ui/typography";

// Base feature properties that all variants share
interface BaseFeature {
  title: string;
  media:
    | {
        type: "image" | "video";
        src: string;
        fallbackImage?: string;
        component?: React.ComponentType;
      }
    | {
        type: "component";
        component: React.ComponentType;
        src?: string;
        fallbackImage?: string;
      };
  imageAlt: string;
}

// For the basic bullets variant
interface BulletsFeature extends BaseFeature {
  variant: "bullets";
  subtitles: string[];
}

// For bullets with CTA variant
interface BulletsCtaFeature extends BaseFeature {
  variant: "bullets-cta";
  subtitles: string[];
  cta: {
    text: string;
    link: string;
    variant?: "primary" | "outline";
  };
}

// For the preview sections variant (like in your image)
interface PreviewSectionsFeature extends BaseFeature {
  variant: "preview-sections";
  subtitle: string;
  sections: Array<{
    title: string;
    description: string;
    docsLink: string;
  }>;
}

// Union type for all feature variants
export type Feature =
  | BulletsFeature
  | BulletsCtaFeature
  | PreviewSectionsFeature;

interface PreviewCardProps {
  feature: Feature;
  position?: "left" | "right";
  isHighlighted?: boolean;
}

export const PreviewCard = ({
  feature,
  position = "left",
  isHighlighted = false,
}: PreviewCardProps) => {
  return (
    <div className="w-full flex xl:flex-row items-center gap-8 flex-col md:gap-8">
      <div
        className={`flex-1 order-1 ${
          position === "left" ? "xl:order-2" : "xl:order-1"
        }`}
      >
        <FeatureText feature={feature} isHighlighted={isHighlighted} />
      </div>
      <div
        className={`flex-1 order-2 ${
          position === "left" ? "xl:order-1" : "xl:order-2"
        }`}
      >
        <FeatureMedia media={feature.media} imageAlt={feature.imageAlt} />
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
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

const DefaultIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.83334 14.1667L14.1667 5.83334M14.1667 5.83334H7.50001M14.1667 5.83334V12.5"
      stroke="currentColor"
      strokeWidth="1.67"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CtaButton = ({
  variant = "primary",
  text,
  link,
  icon: Icon,
}: {
  variant?: "primary" | "outline";
  text: string;
  link: string;
  icon?: React.ComponentType;
}) => {
  const buttonStyles = {
    primary:
      "text-[hsl(var(--primary-foreground))] text-md font-medium h-[40px] px-6 py-1.5 bg-[hsl(var(--primary))] rounded-lg justify-center items-center gap-2.5",
    outline: "gap-2 w-fit text-[hsl(var(--muted-foreground))]",
  };

  return (
    <Link href={link} target="_blank" rel="noopener noreferrer">
      <Button
        className={buttonStyles[variant]}
        variant={variant === "outline" ? "outline" : "action"}
        size={variant === "outline" ? "sm" : "default"}
      >
        {variant === "outline" && (Icon ? <Icon /> : <DefaultIcon />)}
        {text}
      </Button>
    </Link>
  );
};

const FeatureText = ({
  feature,
  isHighlighted,
}: {
  feature: Feature;
  isHighlighted: boolean;
}) => {
  if (feature.variant === "preview-sections") {
    return (
      <div className="w-full flex-col flex gap-4 md:gap-8 max-w-xl flex-1">
        <div className="h-full flex-col justify-start items-start gap-1 flex">
          {feature.title && (
            <H2 className="whitespace-pre-line">{feature.title}</H2>
          )}
          <P className="w-full leading-relaxed">{feature.subtitle}</P>
        </div>

        <div className="flex flex-row gap-4 md:gap-16">
          {feature.sections.map((section, index) => (
            <div key={index} className="flex-col w-full gap-4 flex">
              <div className="w-full flex-col gap-1 flex">
                <H4>{section.title}</H4>
                <Small className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                  {section.description}
                </Small>
              </div>
              <CtaButton
                variant="outline"
                text="View docs"
                link={section.docsLink}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // For both "bullets" and "bullets-cta" variants
  return (
    <div className="flex flex-col justify-between gap-8">
      <div className="flex flex-col">
        {feature.title && (
          <H3 className="whitespace-pre-line">{feature.title}</H3>
        )}
        <ul className="mt-4 space-y-3">
          {feature.subtitles.map((text, index) => (
            <li
              key={index}
              className="flex gap-3 text-[hsl(var(--muted-foreground))]"
            >
              <CheckIcon className="w-4 h-4 text-[hsl(var(--confirmative))] flex-shrink-0 translate-y-[0.25em]" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
      {feature.variant === "bullets-cta" && feature.cta && (
        <div className="mt-auto">
          <CtaButton
            variant={feature.cta.variant}
            text={feature.cta.text}
            link={feature.cta.link}
          />
        </div>
      )}
    </div>
  );
};
