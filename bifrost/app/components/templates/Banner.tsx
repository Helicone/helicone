import React from "react";
import Image from "next/image";

interface BannerProps {
  imagePath?: string;
}

const Banner: React.FC<BannerProps> = ({
  imagePath = "/static/banners/banner_v1.png",
}) => {
  return (
    <div className="w-full flex justify-center py-4">
      <div className="max-w-5xl">
        <a href="/signup" target="_blank" rel="noopener noreferrer">
          <Image
            src={imagePath}
            alt="Performance Graph"
            width={1024}
            height={60}
            className="h-auto w-auto"
          />
        </a>
      </div>
    </div>
  );
};

export default Banner;
