import { useState } from "react";
import { Select, SelectItem, TextInput, Button } from "@tremor/react";
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import { Col } from "../../../layout/common";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import OpenAI from "openai";
import { hpf, hpstatic } from "@helicone/prompts";
import TextbookCourse from "./textbookCourse";
import {
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
} from "@heroicons/react/20/solid";
import { Course, CourseParams, CourseQuiz, CourseSection } from "./types";
import { logger } from "@/lib/telemetry/logger";

type CourseParts =
  | "overview"
  | "section"
  | "quiz"
  | "sectionTitles"
  | "sectionContent";

export const SESSION_NAME = "Course Generator";

export const CourseGenerator: React.FC = () => {
  const jawn = useJawnClient();
  const { user } = useHeliconeAuthClient();
  const [showTextbook, setShowTextbook] = useState(false);

  const [params, setParams] = useState<CourseParams>({
    topic: "Helicone.ai Best Practices",
    difficulty: "Beginner",
    audience: "Developers",
  });
  const [course, setCourse] = useState<Partial<Course>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>("");

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const generateCourse = async () => {
    setIsGenerating(true);
    setShowTextbook(true);
    setCourse({});
    const sessionId = crypto.randomUUID();
    setSessionId(sessionId);

    try {
      // Generate overview
      setCurrentStep("Generating course overview...");
      const overview = await generatePart("overview", params, sessionId);
      setCourse((prev) => ({ ...prev, overview }));

      // Generate section titles based on the overview
      setCurrentStep("Generating section titles...");
      const sectionTitles = await generatePart(
        "sectionTitles",
        { ...params, overview },
        sessionId,
      );

      const sectionCount = Math.min(sectionTitles.titles.length, 5);
      const sections: CourseSection[] = [];
      const quizzes: CourseQuiz[] = [];

      // Generate content for each section
      for (let i = 0; i < sectionCount; i++) {
        setCurrentStep(
          `Creating content for section ${i + 1} of ${sectionCount}...`,
        );
        const sectionContent = await generatePart(
          "sectionContent",
          {
            ...params,
            sectionTitle: sectionTitles.titles[i],
            sectionNumber: i + 1,
          },
          sessionId,
        );
        sections.push({
          title: sectionTitles.titles[i],
          content: sectionContent.content,
        });
        setCourse((prev) => ({
          ...prev,
          sections: [
            ...(prev.sections || []),
            { title: sectionTitles.titles[i], content: sectionContent.content },
          ],
        }));

        setCurrentStep(`Creating quiz for section ${i + 1}...`);
        const quiz = await generatePart(
          "quiz",
          {
            ...params,
            sectionTitle: sectionTitles.titles[i],
            sectionContent: sectionContent.content,
          },
          sessionId,
        );
        quizzes.push(quiz);
        setCourse((prev) => ({
          ...prev,
          quizzes: [...(prev.quizzes || []), quiz],
        }));
      }
    } catch (error) {
      logger.error({ error, sessionId, params }, "Error generating course");
    } finally {
      setIsGenerating(false);
      setCurrentStep("");
    }
  };

  if (showTextbook) {
    return (
      <TextbookCourse
        course={course}
        isGenerating={isGenerating}
        currentStep={currentStep}
        sessionId={sessionId}
      />
    );
  }

  const generatePart = async (
    part: CourseParts,
    args: any,
    sessionId: string,
  ) => {
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: hpstatic`You are an expert course creator.` },
    ];

    let toolName = "";
    let toolDescription = "";
    let toolParameters: any = {};
    let sessionPath = "";

    switch (part) {
      case "overview":
        messages.push({
          role: "user",
          content: hpf`Generate a 1 sentence overview for a ${{
            difficulty: args.difficulty,
          }} level course on ${{ topic: args.topic }} for ${{
            audience: args.audience,
          }}, lasting 5 sessions.`,
        });
        toolName = "generateOverview";
        toolDescription = "Generate the course overview";
        toolParameters = {
          title: { type: "string" },
          description: { type: "string" },
        };
        // Based on the other sections, what should the overview and section titles be?
        sessionPath = "/overview";
        break;
      case "sectionTitles":
        messages.push({
          role: "user",
          content: hpf`Based on the course overview: "${{
            description: args.overview.description,
          }}", generate ${{
            duration: args.duration,
          }} unique and relevant section titles for the course.`,
        });
        toolName = "generateSectionTitles";
        toolDescription = "Generate section titles for the course";
        toolParameters = {
          titles: { type: "array", items: { type: "string" } },
        };
        sessionPath = "/sectionTitles";
        break;
      case "sectionContent":
        messages.push({
          role: "user",
          content: hpf`Generate content that covers the section titled "${{
            sectionTitle: args.sectionTitle,
          }}" for a ${{ difficulty: args.difficulty }} level course on ${{
            topic: args.topic,
          }} for ${{
            audience: args.audience,
          }}}. Not overly lengthy but detailed enough to be useful.`,
        });
        toolName = "generateSectionContent";
        toolDescription = "Generate content for a course section";
        toolParameters = {
          content: { type: "string" },
        };
        sessionPath = `/sections/${args.sectionTitle}/content`;
        break;
      case "quiz":
        messages.push({
          role: "user",
          content: hpf`Generate a quiz for the section titled "${{
            sectionTitle: args.sectionTitle,
          }}" with the following content: "${{
            sectionContent: args.sectionContent.slice(0, 500),
          }}..."`,
        });
        toolName = "generateQuiz";
        toolDescription = "Generate a quiz for a course section";
        toolParameters = {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correctAnswer: { type: "number" },
              },
            },
          },
        };
        sessionPath = `/sections/${args.sectionTitle}/quiz`;
        break;
    }

    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: toolName,
          description: toolDescription,
          parameters: {
            type: "object",
            properties: toolParameters,
            required: Object.keys(toolParameters),
          },
        },
      },
    ];

    try {
      const response = await jawn.POST("/v1/demo/completion", {
        body: {
          messages: messages as any,
          promptId: `Course-Generator-${part}`,
          userEmail: user?.email ?? "no-email",
          sessionId,
          sessionName: SESSION_NAME,
          sessionPath,
          tools,
          tool_choice: {
            type: "function",
            function: {
              name: `generate${part.charAt(0).toUpperCase() + part.slice(1)}`,
            },
          },
          cache_enabled: false,
        },
      });

      if (
        !response.data?.data?.choices ||
        response.data.data.choices.length === 0
      ) {
        throw new Error(`No choices in response for ${part}`);
      }

      const choice = response.data.data.choices[0];
      if (!choice.message) {
        throw new Error(`No message in choice for ${part}`);
      }

      if (
        !choice.message.tool_calls ||
        choice.message.tool_calls.length === 0
      ) {
        throw new Error(`No tool calls in message for ${part}`);
      }

      const toolCall = choice.message.tool_calls[0];
      if (
        toolCall.type !== "function" ||
        toolCall.function.name !==
          `generate${part.charAt(0).toUpperCase() + part.slice(1)}`
      ) {
        throw new Error(
          `Unexpected tool call for ${part}: ${JSON.stringify(toolCall)}`,
        );
      }

      try {
        const parsedArguments = JSON.parse(toolCall.function.arguments);
        return parsedArguments;
      } catch (parseError: any) {
        logger.error(
          {
            parseError,
            part,
            arguments: toolCall.function.arguments,
          },
          `Error parsing arguments for ${part}`,
        );
        throw new Error(
          `Failed to parse arguments for ${part}: ${JSON.stringify(parseError)}`,
        );
      }
    } catch (error) {
      logger.error({ error, part, sessionId }, `Error generating ${part}`);
      throw error;
    }
  };

  const renderCourse = (course: Partial<Course>) => (
    <Col className="space-y-4">
      {course.overview && (
        <>
          <h2 className="text-xl font-semibold">Course Overview</h2>
          <h3 className="text-lg font-semibold">{course.overview.title}</h3>
          <p>{course.overview.description}</p>
        </>
      )}

      {course.sections && course.sections.length > 0 && (
        <>
          <h2 className="text-xl font-semibold">Course Sections</h2>
          {course.sections.map((section, index) => (
            <div key={index} className="rounded-md border p-4">
              <h3
                className="cursor-pointer text-lg font-semibold"
                onClick={() => toggleSection(index)}
              >
                {section.title}
                <span className="ml-2">
                  {expandedSection === index ? "▼" : "▶"}
                </span>
              </h3>
              {expandedSection === index && (
                <Col className="mt-2">
                  <p>{section.content}</p>

                  {course.quizzes && course.quizzes[index] && (
                    <>
                      <h4 className="mt-4 font-semibold">Quiz</h4>
                      {course.quizzes[index].questions.map((q, qIndex) => (
                        <div key={qIndex} className="mt-2">
                          <p>
                            <strong>Q{qIndex + 1}:</strong> {q.question}
                          </p>
                          <ul className="list-disc pl-5">
                            {q.options.map((option, oIndex) => (
                              <li
                                key={oIndex}
                                className={
                                  oIndex === q.correctAnswer ? "font-bold" : ""
                                }
                              >
                                {option}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </>
                  )}
                </Col>
              )}
            </div>
          ))}
        </>
      )}
    </Col>
  );

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-white">
      <h1 className="my-6 text-center text-3xl font-bold text-indigo-900">
        Course Generator
      </h1>

      <div className="mx-auto w-full max-w-sm px-4 pb-6">
        <div className="space-y-4">
          <div className="relative">
            <label
              htmlFor="topic"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Course Topic
            </label>
            <div className="relative">
              <BookOpenIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-indigo-400" />
              <TextInput
                id="topic"
                className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-indigo-400"
                placeholder="e.g. Helicone.ai Best Practices"
                value={params.topic}
                onChange={(e) =>
                  setParams({ ...params, topic: e.target.value })
                }
              />
            </div>
          </div>

          <div className="relative">
            <label
              htmlFor="difficulty"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Difficulty Level
            </label>
            <div className="relative">
              <AcademicCapIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-indigo-400" />
              <Select
                id="difficulty"
                className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-indigo-400"
                value={params.difficulty}
                onValueChange={(value) =>
                  setParams({
                    ...params,
                    difficulty: value as CourseParams["difficulty"],
                  })
                }
              >
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </Select>
            </div>
          </div>

          <div className="relative">
            <label
              htmlFor="audience"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Target Audience
            </label>
            <div className="relative">
              <UserGroupIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-indigo-400" />
              <TextInput
                id="audience"
                className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-indigo-400"
                placeholder="e.g. Developers"
                value={params.audience}
                onChange={(e) =>
                  setParams({ ...params, audience: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <Button
          onClick={generateCourse}
          disabled={isGenerating}
          className={`mt-6 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-indigo-700 ${
            isGenerating ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {isGenerating ? currentStep : "Generate Course"}
        </Button>
      </div>

      {Object.keys(course).length > 0 && (
        <div className="mt-8 max-h-[calc(100vh-400px)] w-full overflow-y-auto rounded-xl bg-white bg-opacity-20 p-6">
          <h2 className="mb-4 text-2xl font-semibold">
            Generated Course Outline:
          </h2>
          {renderCourse(course)}
        </div>
      )}
    </div>
  );
};
