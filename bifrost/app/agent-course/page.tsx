import { Layout } from "@/app/components/Layout";
import { H1, H2, H4, P, Lead, Small } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle, Calendar, Code, Zap } from "lucide-react";

export default function AgentCoursePage() {
  return (
    <Layout>
      <main className="bg-white text-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero Section */}
          <div className="text-center space-y-6 mb-16">
            <H1 className="text-center">
              From Engineer to AI Engineer in 7 days
            </H1>
            <Lead className="text-center max-w-2xl mx-auto">
              <strong>Complete stack:</strong> agents, MCP, monitoring, context,
              and deployment.
            </Lead>

            <div className="text-center space-y-4">
              <div className="max-w-lg mx-auto">
                <form className="flex flex-col gap-4">
                  <input
                    type="email"
                    placeholder="Your email (you@example.com)"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                  <Button
                    size="landing_page"
                    variant="landing_primary"
                    type="submit"
                  >
                    REGISTER TODAY
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Course Overview */}
          <section id="course-overview" className="space-y-12 mb-16">
            <div className="text-center">
              <H2>What You&apos;ll Build</H2>
              <Lead className="text-muted-foreground mt-4 max-w-3xl mx-auto">
                  An agent for Founder Engineers.
              </Lead>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Code size={20} className="text-brand" />
                    <H4>Analyze a codebase</H4>
                  </div>
                </CardHeader>
                <CardContent>
                  <P className="text-muted-foreground">
                    Analyze a codebase, commits, and README files from GitHub
                    repositories using the GitHub API.
                  </P>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Zap size={20} className="text-brand" />
                    <H4>Generate content</H4>
                  </div>
                </CardHeader>
                <CardContent>
                  <P className="text-muted-foreground">
                    AI agent decides what type of marketing content to create
                    and generates drafts for your product.
                  </P>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-brand" />
                    <H4>Automate posting</H4>
                  </div>
                </CardHeader>
                <CardContent>
                  <P className="text-muted-foreground">
                    Run on a cron job to schedule weekly content drafts
                    published via MCP.
                  </P>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Daily Curriculum */}
          <section className="space-y-8 mb-16">
            <div className="text-center">
              <H2>7-Day Curriculum</H2>
              <P className="text-muted-foreground mt-4">
                Each day builds on the previous, with working code and hands-on
                tutorials.
              </P>
            </div>

            <div className="space-y-4">
              {[
                {
                  day: 1,
                  title: "Setup & LLM Requests",
                  description:
                    "Agents vs workflows fundamentals, TypeScript setup, first LLM request",
                },
                {
                  day: 2,
                  title: "The Agent Loop",
                  description:
                    "Core agent architecture (Think → Act → Observe), GitHub API integration",
                },
                {
                  day: 3,
                  title: "Tool Calling & Actions",
                  description:
                    "OpenAI function calling, tool definitions and execution, content generation",
                },
                {
                  day: 4,
                  title: "Memory & Context Management",
                  description:
                    "Conversation history, context window management, token optimization",
                },
                {
                  day: 5,
                  title: "Connecting to MCP Servers",
                  description:
                    "Model Context Protocol, external tool integration, social media posting",
                },
                {
                  day: 6,
                  title: "Monitoring & Observability",
                  description:
                    "Performance metrics, cost tracking, debugging with Helicone",
                },
                {
                  day: 7,
                  title: "Production Deployment",
                  description:
                    "Vercel deployment, cron scheduling, environment configuration",
                },
              ].map((lesson) => (
                <Card key={lesson.day} className="border-l-4 border-l-brand">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          {lesson.day}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <H4>
                          Day {lesson.day}: {lesson.title}
                        </H4>
                        <P className="text-muted-foreground text-sm">
                          {lesson.description}
                        </P>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Why This Approach
          <section className="space-y-8 mb-16">
            <div className="text-center">
              <H2>Agents vs Workflows: A Hybrid Approach</H2>
              <P className="text-muted-foreground mt-4 max-w-3xl mx-auto">
                Most "agents" today aren't agents at all—they're workflows.
                Learn the difference and when to use each.
              </P>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <H4>Workflows</H4>
                  <P className="text-muted-foreground">
                    Follow predetermined paths
                  </P>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-0.5" />
                    <Small>Predictable and reliable</Small>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-0.5" />
                    <Small>Easier to debug</Small>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-0.5" />
                    <Small>Lower cost</Small>
                  </div>
                  <P className="text-muted-foreground text-sm mt-3">
                    Best for: Known steps, reliability over flexibility, cost
                    optimization
                  </P>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <H4>Agents</H4>
                  <P className="text-muted-foreground">
                    Make dynamic decisions
                  </P>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-0.5" />
                    <Small>Flexible and adaptive</Small>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-0.5" />
                    <Small>Handles novel situations</Small>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-0.5" />
                    <Small>Self-correcting</Small>
                  </div>
                  <P className="text-muted-foreground text-sm mt-3">
                    Best for: Variable user intent, complex reasoning,
                    self-correction
                  </P>
                </CardContent>
              </Card>
            </div>
          </section> */}

          {/* Final CTA */}
          <section className="text-center bg-gray-50 rounded-xl p-8">
            <H2>Ready to Build Your First AI Agent?</H2>
            <P className="text-muted-foreground mt-4 mb-8">
              Join the course and start building production-ready AI agents
              today.
            </P>

            <div className="max-w-lg mx-auto">
              <form className="flex flex-col gap-4">
                <input
                  type="email"
                  placeholder="Your email (you@example.com)"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                />
                <Button
                  size="landing_page"
                  variant="landing_primary"
                  type="submit"
                >
                  START BUILDING TODAY
                </Button>
              </form>
            </div>

            <Small className="block mt-6 text-muted-foreground">
              Powered by Helicone
            </Small>
          </section>
        </div>
      </main>
    </Layout>
  );
}
