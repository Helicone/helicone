"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface RequestModelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SubmitStatus = "idle" | "loading" | "success" | "error";

export function RequestModelModal({
  open,
  onOpenChange,
}: RequestModelModalProps) {
  const [modelName, setModelName] = useState("");
  const [providerName, setProviderName] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Hidden field to catch bots

  // Check if the form has valid content (at least one field with non-whitespace content)
  const hasValidContent =
    modelName.trim().length > 0 || providerName.trim().length > 0;

  const handleSubmit = async () => {
    if (!hasValidContent) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/model-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelName,
          providerName,
          website: honeypot, // Honeypot field - bots will fill this
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit request");
      }

      setStatus("success");

      // Reset form and close modal after a delay
      setTimeout(() => {
        setModelName("");
        setProviderName("");
        setStatus("idle");
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  };

  const handleClose = () => {
    if (status !== "loading") {
      setModelName("");
      setProviderName("");
      setStatus("idle");
      setErrorMessage("");
      setHoneypot("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a Model or Provider</DialogTitle>
          <DialogDescription>
            Let us know which model or provider you would like to see supported.
            Fill in at least one field below.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-center text-gray-700 dark:text-gray-300">
              Thank you! Your request has been submitted.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="model-name"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Model Name{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Input
                  id="model-name"
                  placeholder="e.g., claude-3.5-sonnet"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  disabled={status === "loading"}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="provider-name"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Provider Name{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Input
                  id="provider-name"
                  placeholder="e.g., Anthropic"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  disabled={status === "loading"}
                />
              </div>

              {/* Honeypot field - hidden from real users, bots will fill it */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  opacity: 0,
                  height: 0,
                  overflow: "hidden",
                }}
              >
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {status === "error" && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={status === "loading"}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!hasValidContent || status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
