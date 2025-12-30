"use client";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Link from "next/link";
import { ISLAND_WIDTH } from "@/lib/utils";
import { Users, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import ContributorsImg from "@/public/static/home/community.webp";

const INIT = "INIT";
const SUBMITTING = "SUBMITTING";
const ERROR = "ERROR";
const SUCCESS = "SUCCESS";
const formStates = [INIT, SUBMITTING, ERROR, SUCCESS] as const;

const formConfig = {
  id: "clldttldv004ujl0qmorpp00k",
  userGroup: "newsletter",
  domain: "app.loops.so"
};

const EmailBanner = () => {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<(typeof formStates)[number]>(INIT);
  const [errorMessage, setErrorMessage] = useState("");

  const resetForm = () => {
    setEmail("");
    setFormState(INIT);
    setErrorMessage("");
  };

  const isValidEmail = (email: string) => {
    return /.+@.+/.test(email);
  };

  const hasRecentSubmission = () => {
    const time = new Date();
    const timestamp = time.valueOf();
    const previousTimestamp = localStorage.getItem("loops-form-timestamp");

    if (
      previousTimestamp &&
      Number(previousTimestamp) + 60 * 1000 > timestamp
    ) {
      setFormState(ERROR);
      setErrorMessage("Too many signups, please try again in a little while");
      return true;
    }

    localStorage.setItem("loops-form-timestamp", timestamp.toString());
    return false;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formState !== INIT) return;
    if (!isValidEmail(email)) {
      setFormState(ERROR);
      setErrorMessage("Please enter a valid email");
      return;
    }
    if (hasRecentSubmission()) return;
    setFormState(SUBMITTING);

    const formBody = `userGroup=${encodeURIComponent(
      formConfig.userGroup
    )}&email=${encodeURIComponent(email)}&mailingLists=`;

    fetch(`https://${formConfig.domain}/api/newsletter-form/${formConfig.id}`, {
      method: "POST",
      body: formBody,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })
      .then((res: any) => [res.ok, res.json(), res])
      .then(([ok, dataPromise, res]) => {
        if (ok) {
          resetForm();
          setFormState(SUCCESS);
        } else {
          dataPromise.then((data: any) => {
            setFormState(ERROR);
            setErrorMessage(data.message || res.statusText);
            localStorage.setItem("loops-form-timestamp", "");
          });
        }
      })
      .catch((error) => {
        setFormState(ERROR);
        if (error.message === "Failed to fetch") {
          setErrorMessage(
            "Too many signups, please try again in a little while"
          );
        } else if (error.message) {
          setErrorMessage(error.message);
        }
        localStorage.setItem("loops-form-timestamp", "");
      });
  };

  return (
    <div className={cn(ISLAND_WIDTH, "py-16 sm:py-16")}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand/10 via-sky-50 to-blue-50 dark:from-brand/20 dark:via-slate-900 dark:to-slate-800 border border-brand/20">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.05] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

        <div className="relative px-6 py-12 sm:px-12 sm:py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-col gap-4 text-left max-w-2xl">
              <div className="flex items-center gap-2 justify-start">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20">
                  <Sparkles size={14} className="text-brand" />
                  <span className="text-xs font-medium text-brand">
                    Join our Developer Community
                  </span>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-slate-50 leading-tight">
                Building AI agents?
              </h2>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Connect with thousands of engineers shipping production agents.
                Share insights, get help, and stay ahead of the curve.
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 justify-start text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>15,000+ developers</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 w-full lg:w-auto lg:min-w-[400px]">
              {formState === SUCCESS ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle2 size={20} />
                  <span className="font-medium">
                    Thanks! We&apos;ll be in touch soon.
                  </span>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3 w-full"
                >
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={formState === SUBMITTING}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50",
                      "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                      "focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      formState === ERROR
                        ? "border-red-300 dark:border-red-700"
                        : "border-slate-300 dark:border-slate-700"
                    )}
                  />
                  <Button
                    type="submit"
                    variant="landing_primary"
                    size="landing_page"
                    disabled={formState === SUBMITTING}
                    className="w-full sm:w-auto bg-brand hover:bg-brand/90 text-white font-medium px-8 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formState === SUBMITTING ? "Subscribing..." : "Subscribe"}
                  </Button>
                </form>
              )}

              {formState === ERROR && (
                <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
                  <span>
                    {errorMessage ||
                      "Oops! Something went wrong, please try again"}
                  </span>
                  <button
                    onClick={resetForm}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline ml-auto"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailBanner;

