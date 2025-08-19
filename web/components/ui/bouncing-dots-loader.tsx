import React from "react";

interface BouncingDotsLoaderProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

const BouncingDotsLoader = ({
  className = "",
  size = "md",
}: BouncingDotsLoaderProps) => {
  const sizeClasses = {
    xs: "w-1 h-1 mx-0.5",
    sm: "w-2 h-2 mx-1",
    md: "w-4 h-4 mx-1.5",
    lg: "w-6 h-6 mx-2",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex">
        <div
          className={`${sizeClasses[size]} animate-bounce-dot rounded-full bg-muted-foreground opacity-100`}
        />
        <div
          className={`${sizeClasses[size]} animate-bounce-dot rounded-full bg-muted-foreground opacity-100`}
          style={{ animationDelay: "0.2s" }}
        />
        <div
          className={`${sizeClasses[size]} animate-bounce-dot rounded-full bg-muted-foreground opacity-100`}
          style={{ animationDelay: "0.4s" }}
        />
      </div>
    </div>
  );
};

export default BouncingDotsLoader;
