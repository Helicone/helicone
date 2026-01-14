import { Layout } from "@/app/components/Layout";
import { H1, H2, H4, P, Lead, Small } from "@/components/ui/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Code, Zap } from "lucide-react";
import AgentCourseForm from "./AgentCourseForm";
import Image from "next/image";

export default function AgentCoursePage() {

  return (
    <Layout>
      <main className="bg-white text-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
                <AgentCourseForm source="hero-section" />
              </div>
            </div>
          </div>

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
                    "Agents vs workflows fundamentals, TypeScript setup, first LLM request"
                },
                {
                  day: 2,
                  title: "The Agent Loop",
                  description:
                    "Core agent architecture (Think → Act → Observe), GitHub API integration"
                },
                {
                  day: 3,
                  title: "Tool Calling & Actions",
                  description:
                    "OpenAI function calling, tool definitions and execution, content generation"
                },
                {
                  day: 4,
                  title: "Memory & Context Management",
                  description:
                    "Conversation history, context window management, token optimization"
                },
                {
                  day: 5,
                  title: "Connecting to MCP Servers",
                  description:
                    "Model Context Protocol, external tool integration, social media posting"
                },
                {
                  day: 6,
                  title: "Monitoring & Observability",
                  description:
                    "Performance metrics, cost tracking, debugging with Helicone"
                },
                {
                  day: 7,
                  title: "Production Deployment",
                  description:
                    "Vercel deployment, cron scheduling, environment configuration"
                }
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

          <section className="space-y-12 mb-16">
            <div className="text-center">
              <H2>Why Learn from Helicone?</H2>
              <Lead className="text-muted-foreground mt-4 max-w-3xl mx-auto">
                We&apos;ve spent years building the infrastructure that powers production AI agents at scale. Now we&apos;re sharing what we&apos;ve learned.
              </Lead>
            </div>

            <div className="bg-gradient-to-br from-[#f2f9fc] to-white rounded-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-brand mb-2">4.9B+</div>
                  <P className="text-muted-foreground">
                    Requests Processed
                  </P>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-brand mb-2">1.1T</div>
                  <P className="text-muted-foreground">
                    Tokens Per Month
                  </P>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-brand mb-2">28.6M</div>
                  <P className="text-muted-foreground">
                    Users Tracked
                  </P>
                </div>
              </div>

              <div className="space-y-8">
                <Card className="border-l-4 border-l-brand bg-white">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                      <blockquote className="text-lg md:text-xl text-muted-foreground italic">
                        &ldquo;Helicone is{" "}
                        <span className="text-foreground font-semibold not-italic">
                          essential for debugging our complex agentic flows
                        </span>{" "}
                        for AI code reviews. Can&apos;t imagine building without it.&rdquo;
                      </blockquote>
                      <div className="flex items-center gap-4">
                        <Image
                          src="/static/home/logos/soohoon.webp"
                          alt="Soohoon Choi"
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <P className="font-semibold">Soohoon Choi</P>
                          <Small className="text-muted-foreground">
                            CTO, Greptile
                          </Small>
                        </div>
                        <Image
                          src="/static/greptile.webp"
                          alt="Greptile"
                          width={96}
                          height={24}
                          className="w-24 ml-auto"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-brand bg-white">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                      <blockquote className="text-lg md:text-xl text-muted-foreground italic">
                        &ldquo;The{" "}
                        <span className="text-foreground font-semibold not-italic">
                          most impactful one-line change
                        </span>{" "}
                        I&apos;ve seen applied to our codebase.&rdquo;
                      </blockquote>
                      <div className="flex items-center gap-4">
                        <Image
                          src="/static/home/nishantshukla.webp"
                          alt="Nishant Shukla"
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <P className="font-semibold">Nishant Shukla</P>
                          <Small className="text-muted-foreground">
                            Sr. Director of AI, QA Wolf
                          </Small>
                        </div>
                        <Image
                          src="/static/qawolf.webp"
                          alt="QA Wolf"
                          width={96}
                          height={24}
                          className="w-24 ml-auto"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="text-center bg-gray-50 rounded-xl p-8">
            <H2>Ready to Build Your First AI Agent?</H2>
            <P className="text-muted-foreground mt-4 mb-8">
              Join the course and start building production-ready AI agents
              today.
            </P>

            <div className="max-w-lg mx-auto">
              <AgentCourseForm source="bottom-cta" />
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}
