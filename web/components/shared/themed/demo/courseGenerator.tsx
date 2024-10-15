import { useState } from "react";
import { Select, SelectItem, TextInput, Button } from "@tremor/react";
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import { Col } from "../../../layout/common";
import { useUser } from "@supabase/auth-helpers-react";
import OpenAI from "openai";
import { hpf, hpstatic } from "@helicone/prompts";
import TextbookCourse from "./textbookCourse";
import {
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
} from "@heroicons/react/20/solid";

export interface CourseParams {
  topic: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  audience: string;
}

export interface CourseOverview {
  title: string;
  description: string;
}

export interface CourseSection {
  title: string;
  content: string;
}

export interface CourseQuiz {
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
}

export interface Course {
  overview: CourseOverview;
  sections: CourseSection[];
  quizzes: CourseQuiz[];
}

type CourseParts =
  | "overview"
  | "section"
  | "quiz"
  | "sectionTitles"
  | "sectionContent";

export const CourseGenerator: React.FC = () => {
  const jawn = useJawnClient();
  const user = useUser();
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
        sessionId
      );

      const sectionCount = Math.min(sectionTitles.titles.length, 5);
      const sections: CourseSection[] = [];
      const quizzes: CourseQuiz[] = [];

      // Generate content for each section
      for (let i = 0; i < sectionCount; i++) {
        setCurrentStep(
          `Creating content for section ${i + 1} of ${sectionCount}...`
        );
        const sectionContent = await generatePart(
          "sectionContent",
          {
            ...params,
            sectionTitle: sectionTitles.titles[i],
            sectionNumber: i + 1,
          },
          sessionId
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
          sessionId
        );
        quizzes.push(quiz);
        setCourse((prev) => ({
          ...prev,
          quizzes: [...(prev.quizzes || []), quiz],
        }));
      }
    } catch (error) {
      console.error("Error generating course:", error);
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
    sessionId: string
  ) => {
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: hpstatic`You are an expert course creator.` },
    ];

    let toolName = "";
    let toolDescription = "";
    let toolParameters: any = {};
    let maxTokens = 1000;
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
        maxTokens = 250;
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
        maxTokens = 500;
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
        maxTokens = 500;
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
        maxTokens = 300;
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
          messages,
          promptId: `Course-Generator-${part}`,
          userEmail: user?.email ?? "no-email",
          sessionId,
          sessionName: "Course Generator",
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
          `Unexpected tool call for ${part}: ${JSON.stringify(toolCall)}`
        );
      }

      try {
        const parsedArguments = JSON.parse(toolCall.function.arguments);
        return parsedArguments;
      } catch (parseError: any) {
        console.error(
          `Error parsing arguments for ${part}:`,
          toolCall.function.arguments
        );
        throw new Error(
          `Failed to parse arguments for ${part}: ${JSON.stringify(parseError)}`
        );
      }
    } catch (error) {
      console.error(`Error generating ${part}:`, error);
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
            <div key={index} className="border p-4 rounded-md">
              <h3
                className="text-lg font-semibold cursor-pointer"
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
                      <h4 className="font-semibold mt-4">Quiz</h4>
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
    <div className="w-full h-full flex flex-col bg-white overflow-y-auto">
      <h1 className="text-3xl font-bold text-center my-6 text-indigo-900">
        Course Generator
      </h1>

      <div className="w-full max-w-sm mx-auto px-4 pb-6">
        <div className="space-y-4">
          <div className="relative">
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Course Topic
            </label>
            <div className="relative">
              <BookOpenIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
              <TextInput
                id="topic"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-400"
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
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Difficulty Level
            </label>
            <div className="relative">
              <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
              <Select
                id="difficulty"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-400"
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
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Target Audience
            </label>
            <div className="relative">
              <UserGroupIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
              <TextInput
                id="audience"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-400"
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
          className={`w-full mt-6 bg-indigo-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-indigo-700 transition-colors duration-300 ${
            isGenerating ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isGenerating ? currentStep : "Generate Course"}
        </Button>
      </div>

      {Object.keys(course).length > 0 && (
        <div className="mt-8 p-6 bg-white bg-opacity-20 rounded-xl overflow-y-auto max-h-[calc(100vh-400px)] w-full">
          <h2 className="text-2xl font-semibold mb-4">
            Generated Course Outline:
          </h2>
          {renderCourse(course)}
        </div>
      )}
    </div>
  );
};
