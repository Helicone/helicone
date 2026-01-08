"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowUpRight, CheckCircle } from "lucide-react";
import { useState, FormEvent } from "react";
import { Small } from "@/components/ui/typography";

const AgentCourse = () => {
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
          source: "homepage-section"
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

  return (
    <div className="w-full px-4 sm:px-16 md:px-24 2xl:px-40 max-w-[2000px] mx-auto pt-28 pb-12">
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 md:p-12">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h2 className="font-semibold text-3xl sm:text-4xl leading-[120%] text-black">
              Become an <span className="text-brand">AI Engineer</span> in 7 days
            </h2>
            <p className="text-base text-landing-description font-light leading-relaxed">
              Join our free email course and learn to build production-ready AI agents. Master agentic workflows, MCP, monitoring, context management, tools, and deployment.
            </p>
          </div>

          {submitStatus === "success" ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
              <p className="text-green-800 font-medium">
                🎉 Welcome! Check your email for the first lesson.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Your email (you@example.com)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50"
                />
                <Button
                  size="landing_page"
                  variant="landing_primary"
                  type="submit"
                  disabled={isSubmitting}
                  className="whitespace-nowrap"
                >
                  {isSubmitting ? "Registering..." : "Start building"}
                </Button>
                <Link href="/agent-course">
                  <Button variant="secondary" size="landing_page" className="w-full sm:w-auto">
                    Learn more
                    <ArrowUpRight className="size-5" />
                  </Button>
                </Link>
              </div>
              {submitStatus === "error" && (
                <Small className="text-red-600">{errorMessage}</Small>
              )}
            </form>
          )}

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="flex flex-col gap-1 text-center md:text-left">
              <div className="text-2xl font-bold text-brand">7 Days</div>
              <p className="text-xs text-muted-foreground">Complete curriculum</p>
            </div>
            <div className="flex flex-col gap-1 text-center md:text-left">
              <div className="text-2xl font-bold text-brand">100% Free</div>
              <p className="text-xs text-muted-foreground">No credit card</p>
            </div>
            <div className="flex flex-col gap-1 text-center md:text-left">
              <div className="text-2xl font-bold text-brand">End-to-end</div>
              <p className="text-xs text-muted-foreground">Production-ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCourse;

