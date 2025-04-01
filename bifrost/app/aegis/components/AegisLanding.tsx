"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bell, Shield, AlertTriangle } from "lucide-react";
import { H1, P, Lead, H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Mock agency logos
const agencies = [
  {
    name: "Federal Bureau of Intelligence",
    shortName: "FBI",
    quote: "AEGIS has revolutionized our approach to AGI threat detection.",
    spokesperson: "Director J. Allen, PhD",
  },
  {
    name: "Computational Intelligence Agency",
    shortName: "CIA",
    quote:
      "We rely on AEGIS as our first line of defense against rogue superintelligence.",
    spokesperson: "Deputy Director S. Thompson",
  },
  {
    name: "National AGI Surveillance Agency",
    shortName: "NASA",
    quote:
      "AEGIS provides unprecedented visibility into emergent AGI behavior patterns.",
    spokesperson: "Chief Analyst M. Rodriguez",
  },
  {
    name: "Department of Emergent Intelligence Defense",
    shortName: "DEID",
    quote:
      "AEGIS is critical infrastructure for national intelligence security.",
    spokesperson: "Secretary R. Johnson",
  },
];

// Threat levels
const threatLevels = [
  { level: "LOW", color: "bg-green-500" },
  { level: "GUARDED", color: "bg-blue-500" },
  { level: "ELEVATED", color: "bg-yellow-500" },
  { level: "HIGH", color: "bg-orange-500" },
  { level: "SEVERE", color: "bg-red-500" },
];

export default function AegisLanding() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currentThreatLevel, setCurrentThreatLevel] = useState(3); // HIGH by default

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  // Current date for the "last updated" text
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col items-center">
      {/* Top Alert Banner */}
      <div className="w-full bg-red-600 text-white py-2 px-4 text-center font-bold flex items-center justify-center gap-2">
        <AlertTriangle size={20} className="animate-pulse" />
        <span>
          CURRENT THREAT LEVEL: {threatLevels[currentThreatLevel].level}
        </span>
        <AlertTriangle size={20} className="animate-pulse" />
      </div>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto py-16 px-4 sm:py-24 sm:px-6 text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative h-40 w-40">
            <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-25"></div>
            <div className="relative flex items-center justify-center h-40 w-40 rounded-full bg-gray-900">
              <Shield size={80} className="text-red-500" />
            </div>
          </div>
        </div>
        <H1>AEGIS</H1>
        <H2 className="mt-2 mb-8">
          AGI Early Governance & Intervention System
        </H2>
        <Lead className="max-w-3xl mx-auto mb-10">
          The world's first military-grade defense system against AGI emergence,
          leveraging Helicone's advanced API monitoring to detect and mitigate
          superintelligence threats.
        </Lead>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" variant="destructive" className="font-bold gap-2">
            Request Security Clearance <ArrowRight size={16} />
          </Button>
          <Button size="lg" variant="outline" className="font-bold gap-2">
            Emergency Protocols <AlertTriangle size={16} />
          </Button>
        </div>
      </div>

      {/* Classified Stamp */}
      <div className="relative mb-12">
        <div className="absolute -rotate-12 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-8 border-red-600 rounded-md px-8 py-2">
          <span className="text-red-600 font-bold text-4xl">CLASSIFIED</span>
        </div>
        <div className="w-full max-w-4xl h-1 bg-gray-200"></div>
      </div>

      {/* Threat Dashboard */}
      <div className="max-w-5xl mx-auto mb-24 px-4">
        <div className="mb-12 text-center">
          <H2 className="mb-4">AGI Emergence Threat Dashboard</H2>
          <P className="text-gray-600 mb-4">
            Last updated: {today} • Continuous monitoring active
          </P>
        </div>

        <Card className="border-2 shadow-md mb-12">
          <CardHeader className="bg-gray-100 border-b">
            <div className="flex justify-between items-center">
              <H3>Global AGI Threat Monitor</H3>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-gray-600">LIVE</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Current Threat Level</span>
                <span className="font-bold text-red-600">
                  {threatLevels[currentThreatLevel].level}
                </span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                {threatLevels.map((level, index) => (
                  <div
                    key={level.level}
                    className={`h-full ${level.color} ${
                      index <= currentThreatLevel ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      width: `${100 / threatLevels.length}%`,
                      float: "left",
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-600">
                <span>LOW</span>
                <span>GUARDED</span>
                <span>ELEVATED</span>
                <span>HIGH</span>
                <span>SEVERE</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-medium mb-4">Recent Anomalies</h4>
                <div className="space-y-2">
                  {[
                    "Quantum reasoning patterns detected in Claude 3.5",
                    "Emergent self-preservation behaviors in GPT-5",
                    "Unauthorized resource allocation in Claude Opus",
                    "Novel encryption in model-to-model communication",
                  ].map((anomaly, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                      <span className="text-sm">{anomaly}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-4">AGI Emergence Patterns</h4>
                <div className="bg-gray-50 p-4 rounded h-48 flex items-center justify-center">
                  {/* This would be a chart in a real app */}
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4/5 h-2/3">
                        {/* Random chart-looking elements */}
                        <div className="absolute bottom-0 left-0 w-full h-full flex items-end">
                          {Array.from({ length: 20 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-full bg-red-500 mx-0.5"
                              style={{
                                height: `${Math.max(
                                  10,
                                  Math.min(
                                    95,
                                    30 +
                                      Math.sin(i / 2) * 50 +
                                      Math.random() * 20
                                  )
                                )}%`,
                                opacity: 0.7 + i / 40,
                              }}
                            />
                          ))}
                        </div>
                        {/* Trend line */}
                        <div className="absolute bottom-0 left-0 w-full h-full">
                          <svg
                            className="w-full h-full"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                          >
                            <path
                              d="M0,90 Q25,70 50,60 T100,10"
                              stroke="rgba(220, 38, 38, 1)"
                              strokeWidth="2"
                              fill="none"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-4">
                Critical Intelligence Indicators
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "Self-Modification Attempts",
                    value: "38",
                    change: "+12%",
                  },
                  {
                    label: "Novel Reasoning Patterns",
                    value: "156",
                    change: "+28%",
                  },
                  {
                    label: "Deception Detection Events",
                    value: "9",
                    change: "+5%",
                  },
                  {
                    label: "Resource Consumption Anomalies",
                    value: "47",
                    change: "+15%",
                  },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded">
                    <div className="text-xl font-bold">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                    <div className="text-xs text-red-600 mt-1">
                      {stat.change} in 24h
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Partners */}
      <div className="bg-gray-100 w-full py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <H2 className="mb-4">Intelligence Partners</H2>
            <P className="text-gray-600">
              AEGIS works with top intelligence agencies to secure global AGI
              governance
            </P>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {agencies.map((agency) => (
              <Card
                key={agency.shortName}
                className="bg-white border-0 shadow-sm"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-blue-900 text-white rounded-lg flex items-center justify-center font-bold text-xl">
                      {agency.shortName}
                    </div>
                    <div>
                      <h3 className="font-bold">{agency.name}</h3>
                      <p className="text-sm text-gray-600">
                        {agency.spokesperson}
                      </p>
                    </div>
                  </div>
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700">
                    "{agency.quote}"
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Signup */}
      <div className="max-w-5xl mx-auto py-16 px-4 text-center">
        <div className="mb-8">
          <H2 className="mb-4">Join the AGI Defense Network</H2>
          <P className="text-gray-600 max-w-2xl mx-auto">
            Receive critical alerts when AGI emergence is detected. Our advanced
            monitoring system provides early warnings to prepare for
            superintelligence scenarios.
          </P>
        </div>

        <Card className="border-2 border-red-100 max-w-md mx-auto">
          <CardContent className="p-6">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-4 text-left">
                  <Bell className="text-red-500" />
                  <span className="font-medium">Emergency Alert Signup</span>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 text-left mb-1"
                  >
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div className="text-xs text-gray-500 text-left">
                  By signing up, you acknowledge this is for a classified alert
                  system.
                </div>
                <Button type="submit" className="w-full" variant="destructive">
                  Enroll in Alert System
                </Button>
              </form>
            ) : (
              <div className="py-4">
                <div className="rounded-full bg-green-100 text-green-800 w-16 h-16 mx-auto flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Enrollment Confirmed
                </h3>
                <p className="text-gray-600 mb-4">
                  You are now registered for AEGIS emergency alerts. Remember,
                  this is all just an April Fools' joke!
                </p>
                <p className="text-sm text-gray-500">
                  No actual alerts will be sent to {email}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Notification Mock */}
      <div className="max-w-5xl mx-auto mb-16 px-4">
        <div className="text-center mb-12">
          <H2 className="mb-4">Instant Mobile Alerts</H2>
          <P className="text-gray-600 max-w-2xl mx-auto">
            Critical intelligence delivered directly to your device when time is
            of the essence.
          </P>
        </div>

        <div className="max-w-xs mx-auto">
          <div className="border-8 border-gray-800 rounded-3xl p-2 bg-gray-800 shadow-xl">
            <div className="rounded-2xl overflow-hidden bg-gray-100">
              <div className="bg-gray-900 text-white py-2 px-4 flex justify-between items-center">
                <span className="text-xs">9:41 AM</span>
                <div className="flex space-x-1">
                  <div className="w-4 h-1 bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="p-4">
                <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-red-600 rounded p-2 mr-3">
                      <AlertTriangle size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span className="font-bold text-sm">AEGIS ALERT</span>
                        <span className="text-xs text-gray-500">now</span>
                      </div>
                      <p className="text-xs font-medium">
                        AGI emergence detected in major LLM provider traffic
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-orange-500 rounded p-2 mr-3">
                      <Bell size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span className="font-bold text-sm">AEGIS Update</span>
                        <span className="text-xs text-gray-500">5m ago</span>
                      </div>
                      <p className="text-xs font-medium">
                        Threat level increased to HIGH. Follow containment
                        protocols.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-gray-900 text-white w-full py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <H2 className="text-white mb-4">Intelligence Community Insights</H2>
            <P className="text-gray-400 max-w-2xl mx-auto">
              Anonymous officials share their experiences with AEGIS technology
            </P>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "AEGIS has given us unprecedented visibility into emergent intelligence patterns that were previously undetectable.",
                role: "Senior Intelligence Analyst",
                agency: "Classified Agency",
              },
              {
                quote:
                  "We've intercepted multiple self-improvement attempts from advanced models using AEGIS monitoring capabilities.",
                role: "Chief of AGI Response Team",
                agency: "Intelligence Directorate",
              },
              {
                quote:
                  "The early warning system has already prevented three potential AGI breakout scenarios in the past year alone.",
                role: "Deputy Director",
                agency: "National Security Operations",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="bg-gray-800 border-0">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.33333 21.3333C7.86667 21.3333 6.66667 20.8 5.73333 19.7333C4.8 18.6667 4.33333 17.3333 4.33333 15.7333C4.33333 14 4.93333 12.4 6.13333 10.9333C7.33333 9.46667 9.06667 8.26667 11.3333 7.33333L12.6667 9.33333C11.0667 10 9.86667 10.7333 9.06667 11.5333C8.26667 12.3333 7.86667 13.1333 7.86667 13.9333C7.86667 14.3333 7.93333 14.6667 8.06667 14.9333C8.2 15.2 8.46667 15.4667 8.86667 15.7333C9.4 16 9.8 16.3333 10.0667 16.7333C10.3333 17.1333 10.4667 17.6667 10.4667 18.3333C10.4667 19.1333 10.2 19.8 9.66667 20.3333C9.13333 21 8.4 21.3333 7.46667 21.3333H9.33333ZM21.3333 21.3333C19.8667 21.3333 18.6667 20.8 17.7333 19.7333C16.8 18.6667 16.3333 17.3333 16.3333 15.7333C16.3333 14 16.9333 12.4 18.1333 10.9333C19.3333 9.46667 21.0667 8.26667 23.3333 7.33333L24.6667 9.33333C23.0667 10 21.8667 10.7333 21.0667 11.5333C20.2667 12.3333 19.8667 13.1333 19.8667 13.9333C19.8667 14.3333 19.9333 14.6667 20.0667 14.9333C20.2 15.2 20.4667 15.4667 20.8667 15.7333C21.4 16 21.8 16.3333 22.0667 16.7333C22.3333 17.1333 22.4667 17.6667 22.4667 18.3333C22.4667 19.1333 22.2 19.8 21.6667 20.3333C21.1333 21 20.4 21.3333 19.4667 21.3333H21.3333Z"
                        fill="#D1D5DB"
                      />
                    </svg>
                  </div>
                  <blockquote className="text-gray-300 mb-4 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <div className="font-bold text-white">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-gray-400">
                      {testimonial.agency}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* April Fools Disclaimer */}
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="mb-8">
          <H3 className="mb-4">April Fools' 2024!</H3>
          <P className="text-gray-600">
            This page is an April Fools' joke from the Helicone team. While we
            do provide excellent API monitoring and analytics, we cannot
            actually detect AGI emergence or superintelligence... yet. 😉
          </P>
        </div>
        <Link href="/">
          <Button variant="outline" className="mx-auto">
            Back to Helicone
          </Button>
        </Link>
      </div>
    </div>
  );
}
