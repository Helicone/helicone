"use client";

import React, { ReactNode, Suspense } from "react";
import { useInView } from "react-intersection-observer";

interface LazyLoadComponentProps {
  children: ReactNode;
  fallback: ReactNode;
  // Optional: Adjust when the component triggers loading (e.g., '100px' before entering viewport)
  rootMargin?: string;
  // Optional: Only trigger loading once
  triggerOnce?: boolean;
}

const LazyLoadComponent: React.FC<LazyLoadComponentProps> = ({
  children,
  fallback,
  rootMargin = "200px", // Start loading 200px before it enters viewport
  triggerOnce = true, // Only load once
}) => {
  const { ref, inView } = useInView({
    triggerOnce: triggerOnce,
    rootMargin: rootMargin,
  });

  return (
    <div ref={ref}>
      {inView ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
};

export default LazyLoadComponent;
