"use client";

import { useState } from "react";
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
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.helicone.ai";

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
      const response = await fetch(
        `${apiUrl}/v1/public/waitlist/feature`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer undefined",
          },
          body: JSON.stringify({
            email,
            feature: "credits",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (result.error === "already_on_waitlist") {
          setError("You're already on the waitlist!");
        } else {
          setError("Failed to join waitlist. Please try again.");
        }
      } else {
        if (result.data?.position) {
          setPosition(result.data.position);
        }
        setIsSuccess(true);
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
    if ((platform === "twitter" && (hasSharedTwitter || pendingShareTwitter)) || 
        (platform === "linkedin" && (hasSharedLinkedIn || pendingShareLinkedIn))) {
      return;
    }

    // Open the share link in a popup
    let shareWindow;
    if (platform === "twitter") {
      const tweetUrl = `https://x.com/coleywoleyyy/status/1965525511071039632`;
      shareWindow = window.open(tweetUrl, "twitter-share", "width=600,height=700,left=200,top=100");
      setPendingShareTwitter(true);
    } else {
      // For LinkedIn, open in a popup
      const linkedinUrl = `https://www.linkedin.com/posts/colegottdank_the-helicone-yc-w23-team-goes-to-topgolf-activity-7365872991773069312-7koL`;
      shareWindow = window.open(linkedinUrl, "linkedin-share", "width=700,height=700,left=200,top=100");
      setPendingShareLinkedIn(true);
    }

    // Check when window closes
    if (shareWindow) {
      const checkClosed = setInterval(() => {
        if (shareWindow.closed) {
          clearInterval(checkClosed);
          // Window closed, keep pending state to show confirmation
        }
      }, 500);
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
            action: "repost", // Just use repost for 10 points
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
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30">
          <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="mb-2 text-2xl font-bold text-slate-900">
            {position ? `You're #${position.toLocaleString()} in line!` : "You're on the list!"}
          </h3>
          <p className="text-slate-600 mb-4">
            We'll notify you at <strong className="text-slate-900">{email}</strong> when you get beta access.
          </p>
          
          {/* Simple share buttons */}
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900 mb-3">
              Want to move up? Share with your network!
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => openShareWindow("twitter")}
                disabled={hasSharedTwitter || pendingShareTwitter}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  hasSharedTwitter
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : pendingShareTwitter
                    ? "bg-gray-100 text-gray-600"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {hasSharedTwitter ? "✓ Shared on X" : 
                 pendingShareTwitter ? "Waiting..." : 
                 "Share on X (+10 spots)"}
              </button>
              <button
                onClick={() => openShareWindow("linkedin")}
                disabled={hasSharedLinkedIn || pendingShareLinkedIn}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  hasSharedLinkedIn
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : pendingShareLinkedIn
                    ? "bg-blue-100 text-blue-600"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {hasSharedLinkedIn ? "✓ Shared on LinkedIn" : 
                 pendingShareLinkedIn ? "Waiting..." : 
                 "Share on LinkedIn (+10 spots)"}
              </button>
            </div>
            
            {/* Confirmation UI */}
            {(pendingShareTwitter || pendingShareLinkedIn) && (
              <div className="mt-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium text-slate-900">
                      Did you engage with the {pendingShareTwitter ? "tweet" : "LinkedIn post"}?
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Confirm to receive your +10 spot bonus
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => confirmShare(pendingShareTwitter ? "twitter" : "linkedin")}
                      className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
                    >
                      Yes, I engaged
                    </button>
                    <button
                      onClick={() => cancelShare(pendingShareTwitter ? "twitter" : "linkedin")}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Not yet
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {(hasSharedTwitter || hasSharedLinkedIn) && !(hasSharedTwitter && hasSharedLinkedIn) && (
              <p className="text-xs text-slate-500 mt-3">
                Share on both platforms for maximum boost!
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center ${className}`}>
        <h3 className="mb-2 text-lg font-semibold text-slate-900">
          Join the Waitlist
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          {initialCount && initialCount > 0 ? (
            <>
              <span className="font-semibold text-brand">100+ people</span> are already waiting.
              <br />
              Be next to get Credits when it launches.
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

  // Inline variant
  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-3 sm:flex-row ${className}`}
    >
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:min-w-[300px]"
        disabled={isLoading}
      />
      <Button
        type="submit"
        disabled={isLoading}
        variant="default"
      >
        {isLoading ? "Joining..." : "Join Waitlist"}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600 sm:absolute sm:mt-12">
          {error}
        </p>
      )}
    </form>
  );
}