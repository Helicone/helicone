"use client";

import { useState, useEffect, useRef } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

interface CreditsWaitlistFormProps {
  variant?: "inline" | "card";
  className?: string;
  initialCount?: number | null;
}

export function CreditsWaitlistForm({
  variant = "card",
  className = "",
  initialCount,
}: CreditsWaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [hasSharedTwitter, setHasSharedTwitter] = useState(false);
  const [hasSharedLinkedIn, setHasSharedLinkedIn] = useState(false);
  const [pendingShareTwitter, setPendingShareTwitter] = useState(false);
  const [pendingShareLinkedIn, setPendingShareLinkedIn] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Ref to store interval ID for cleanup
  const windowCheckInterval = useRef<NodeJS.Timeout>();

  // Load email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("waitlist_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.helicone.ai";

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (windowCheckInterval.current) {
        clearInterval(windowCheckInterval.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/v1/public/waitlist/feature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer undefined",
        },
        body: JSON.stringify({
          email,
          feature: "credits",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === "already_on_waitlist") {
          setError("You're already on the waitlist!");
        } else {
          setError("Failed to join waitlist. Please try again.");
        }
      } else {
        // Save email to localStorage on successful submission
        localStorage.setItem("waitlist_email", email);

        // Check if user was already on the list
        if (result.data?.alreadyOnList) {
          setIsReturningUser(true);
          setPosition(result.data.position);
          // Set which platforms they've already shared
          if (result.data.sharedPlatforms?.includes("twitter")) {
            setHasSharedTwitter(true);
          }
          if (result.data.sharedPlatforms?.includes("linkedin")) {
            setHasSharedLinkedIn(true);
          }
          setIsSuccess(true);
        } else {
          // New user added to waitlist
          if (result.data?.position) {
            setPosition(result.data.position);
          }
          setIsSuccess(true);
        }
      }
    } catch (err) {
      console.error("Error joining waitlist:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const openShareWindow = (platform: "twitter" | "linkedin") => {
    // Don't allow multiple shares on same platform
    if (
      (platform === "twitter" && (hasSharedTwitter || pendingShareTwitter)) ||
      (platform === "linkedin" && (hasSharedLinkedIn || pendingShareLinkedIn))
    ) {
      return;
    }

    // Clear any existing interval
    if (windowCheckInterval.current) {
      clearInterval(windowCheckInterval.current);
      windowCheckInterval.current = undefined;
    }

    // Open the share link in a popup
    let shareWindow;
    if (platform === "twitter") {
      const tweetUrl = `https://x.com/justinstorre/status/1966175044821987542`;
      shareWindow = window.open(
        tweetUrl,
        "twitter-share",
        "width=600,height=700,left=200,top=100"
      );
      setPendingShareTwitter(true);
    } else {
      // For LinkedIn, open in a popup
      const linkedinUrl = `https://www.linkedin.com/posts/colegottdank_the-helicone-yc-w23-team-goes-to-topgolf-activity-7365872991773069312-7koL`;
      shareWindow = window.open(
        linkedinUrl,
        "linkedin-share",
        "width=700,height=700,left=200,top=100"
      );
      setPendingShareLinkedIn(true);
    }

    // Check when window closes
    if (shareWindow) {
      const checkClosed = setInterval(() => {
        if (shareWindow.closed) {
          clearInterval(checkClosed);
          windowCheckInterval.current = undefined;
          // Window closed, keep pending state to show confirmation
        }
      }, 500);

      // Store the interval ID for cleanup
      windowCheckInterval.current = checkClosed;
    }
  };

  const confirmShare = async (platform: "twitter" | "linkedin") => {
    // Mark as shared
    if (platform === "twitter") {
      setHasSharedTwitter(true);
      setPendingShareTwitter(false);
    } else {
      setHasSharedLinkedIn(true);
      setPendingShareLinkedIn(false);
    }

    // Track the share (give them 10 points)
    try {
      const response = await fetch(
        `${apiUrl}/v1/public/waitlist/feature/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer undefined",
          },
          body: JSON.stringify({
            email,
            feature: "credits",
            platform,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.data?.newPosition) {
          setPosition(result.data.newPosition);
        }
      }
    } catch (err) {
      console.error("Error tracking share:", err);
    }
  };

  const cancelShare = (platform: "twitter" | "linkedin") => {
    if (platform === "twitter") {
      setPendingShareTwitter(false);
    } else {
      setPendingShareLinkedIn(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-2">
        {/* Success message */}
        <div className="flex items-center justify-center gap-2">
          <CheckIcon className="h-5 w-5 text-brand flex-shrink-0" />
          <p className="text-sm text-slate-700">
            <span className="font-semibold">
              {isReturningUser
                ? `You're already on the waitlist! You're #${position?.toLocaleString()} in line`
                : `Success! You're #${position?.toLocaleString()} in line`}
            </span>
          </p>
        </div>
        {/* Share section */}
        {!hasSharedTwitter || !hasSharedLinkedIn ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-slate-600">
              {isReturningUser && (hasSharedTwitter || hasSharedLinkedIn)
                ? "Share on more platforms to move up faster"
                : "Share on social to move up the waitlist faster"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => openShareWindow("twitter")}
                disabled={hasSharedTwitter || pendingShareTwitter}
                className={`px-4 h-[42px] rounded-lg text-sm font-medium transition-colors ${
                  hasSharedTwitter
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : pendingShareTwitter
                      ? "bg-gray-100 text-gray-600"
                      : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {hasSharedTwitter
                  ? "✓ X"
                  : pendingShareTwitter
                    ? "..."
                    : "Share X"}
              </button>
              <button
                onClick={() => openShareWindow("linkedin")}
                disabled={hasSharedLinkedIn || pendingShareLinkedIn}
                className={`px-4 h-[42px] rounded-lg text-sm font-medium transition-colors ${
                  hasSharedLinkedIn
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : pendingShareLinkedIn
                      ? "bg-blue-100 text-blue-600"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {hasSharedLinkedIn
                  ? "✓ LinkedIn"
                  : pendingShareLinkedIn
                    ? "..."
                    : "Share LinkedIn"}
              </button>
            </div>
          </div>
        ) : (
          // Both platforms shared
          hasSharedTwitter &&
          hasSharedLinkedIn && (
            <p className="text-sm text-slate-600">
              Thanks for sharing! You&apos;ve maximized your position boost.
            </p>
          )
        )}

        {/* Compact confirmation UI */}
        {(pendingShareTwitter || pendingShareLinkedIn) && (
          <div className="flex items-center gap-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">Did you share?</p>
            <button
              onClick={() =>
                confirmShare(pendingShareTwitter ? "twitter" : "linkedin")
              }
              className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
            >
              Yes ✓
            </button>
            <button
              onClick={() =>
                cancelShare(pendingShareTwitter ? "twitter" : "linkedin")
              }
              className="px-3 py-1 bg-white border border-slate-300 text-slate-600 rounded text-xs hover:bg-slate-50"
            >
              Not yet
            </button>
          </div>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center ${className}`}
      >
        <h3 className="mb-2 text-lg font-semibold text-slate-900">
          Join the Waitlist
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          {initialCount && initialCount > 0 ? (
            <>
              <span className="font-semibold text-brand">
                {initialCount.toLocaleString()}+ people
              </span>{" "}
              are already waiting.
              <br />
              Be next in line for beta access.
            </>
          ) : (
            "Be the first to know when Credits launches."
          )}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            variant="default"
          >
            {isLoading ? "Joining..." : "Join Waitlist"}
          </Button>
        </form>
      </div>
    );
  }

  // Inline variant - Compact horizontal layout
  return (
    <div className={`${className}`}>
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-slate-600 h-5">
          {initialCount && initialCount > 0 ? (
            <>
              <span className="font-semibold text-brand">
                {initialCount.toLocaleString()}+ people
              </span>{" "}
              already waiting
            </>
          ) : (
            <span>&nbsp;</span>
          )}
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2 w-full max-w-md mx-auto"
        >
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading}
            variant="default"
            className="px-6 py-2.5 h-auto"
          >
            {isLoading ? "Joining..." : "Join Waitlist"}
          </Button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
