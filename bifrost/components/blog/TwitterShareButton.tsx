"use client";

import { Button } from "@/components/ui/button";
import { Twitter } from "lucide-react";

interface TwitterShareButtonProps {
  title: string;
  path: string;
}

export function TwitterShareButton({ title, path }: TwitterShareButtonProps) {
  const handleTwitterShare = () => {
    const url = `https://www.helicone.ai/blog/${path}`;
    
    const tweetText = `Just read "${title}" by @helicone_ai.`;

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweetText
    )}&url=${encodeURIComponent(url)}`;
    
    window.open(tweetUrl, "_blank");
  };

  return (
    <Button
      variant="ghost"
      className="w-full text-[#6B8C9C] hover:text-[#5a7a8a] hover:bg-[#E3EFF3]"
      onClick={handleTwitterShare}
    >
      Share
      <Twitter className="ml-2 h-4 w-4" />
    </Button>
  );
} 