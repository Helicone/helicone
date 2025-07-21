"use client";

import React, { useState } from "react";
import { Check, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface HeadingWithCopyLinkProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  id?: string;
  children?: React.ReactNode;
  className?: string;
}

export const HeadingWithCopyLink: React.FC<HeadingWithCopyLinkProps> = ({
  level,
  id,
  children,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

  const copyAndJump = async () => {
    if (!id) return;

    const anchor = `#${id}`;
    try {
      await navigator.clipboard.writeText(anchor);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }

    // Jump to the element
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", anchor);
    }
  };

  return (
    <HeadingTag
      id={id}
      className={cn(
        "group relative flex cursor-pointer items-center gap-2",
        className
      )}
      onClick={copyAndJump}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {id && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden size-4 shrink-0 sm:inline-flex"
          onClick={(e) => {
            e.stopPropagation();
            copyAndJump();
          }}
          aria-label="Copy link to section"
        >
          {copied ? (
            <Check className="text-muted-foreground size-full" />
          ) : isHovered ? (
            <Link className="text-muted-foreground size-full" />
          ) : null}
        </Button>
      )}
    </HeadingTag>
  );
};
