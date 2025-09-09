"use client";

import { useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

interface CreditsWaitlistFormProps {
  variant?: "inline" | "card";
  className?: string;
}

export function CreditsWaitlistForm({
  variant = "card",
  className = "",
}: CreditsWaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "https://api.helicone.ai/v1/public/waitlist/feature",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer undefined", // Public endpoint
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
        setIsSuccess(true);
      }
    } catch (err) {
      console.error("Error joining waitlist:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30">
          <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="mb-2 text-xl font-semibold text-slate-900">
            You're on the list!
          </h3>
          <p className="text-slate-600">
            We'll notify you at <strong className="text-slate-900">{email}</strong> when Credits launches.
          </p>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
        <h3 className="mb-2 text-lg font-semibold text-slate-900">
          Join the Waitlist
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          Be the first to know when Credits launches.
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