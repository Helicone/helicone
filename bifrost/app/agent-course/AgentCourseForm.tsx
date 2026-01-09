"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Small } from "@/components/ui/typography";
import { CheckCircle } from "lucide-react";

export default function AgentCourseForm({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !isValidEmail(email)) {
      setSubmitStatus("error");
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/agent-course-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          source
        })
      });

      if (!response.ok) {
        throw new Error("Failed to register for the course");
      }

      setSubmitStatus("success");
      setEmail("");
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === "success") {
    return (
      <div className="flex flex-col gap-4 items-center p-6 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle size={48} className="text-green-600" />
        <p className="text-green-800 font-medium">
          🎉 Welcome! Check your email for the first lesson.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="Your email (you@example.com)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isSubmitting}
        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50"
      />
      <Button
        size="landing_page"
        variant="landing_primary"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "REGISTERING..." : source === "hero-section" ? "REGISTER TODAY" : "START BUILDING TODAY"}
      </Button>
      {submitStatus === "error" && (
        <Small className="text-red-600">{errorMessage}</Small>
      )}
    </form>
  );
}

