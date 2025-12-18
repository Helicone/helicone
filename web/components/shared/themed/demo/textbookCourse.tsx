import { useState, useEffect } from "react";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-markup-templating";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import { Course } from "./types";
import Link from "next/link";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { SESSION_NAME } from "./courseGenerator";

interface TextbookCourseProps {
  course: Partial<Course>;
  isGenerating: boolean;
  currentStep: string;
  sessionId: string;
}

type QuizAnswers = Record<number, Record<number, number>>;
type QuizSubmitted = Record<number, boolean>;

const TextbookCourse: React.FC<TextbookCourseProps> = ({
  course,
  isGenerating,
  currentStep,
  sessionId,
}) => {
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});
  const [quizSubmitted, setQuizSubmitted] = useState<QuizSubmitted>({});
  const [isOverviewExpanded, setIsOverviewExpanded] = useState<boolean>(false);

  useEffect(() => {
    const renderer = new marked.Renderer();

    renderer.code = ({ text, lang }) => {
      const language = lang && languages[lang] ? lang : "markdown";
      const highlightedCode = highlight(
        text,
        languages[language] || languages.markdown,
        language,
      );
      return `<pre><code class="language-${language}">${highlightedCode}</code></pre>`;
    };

    marked.setOptions({
      renderer: renderer,
      breaks: true,
      gfm: true,
    });
  }, []);

  const handleQuizAnswer = (
    sectionIndex: number,
    questionIndex: number,
    answerIndex: number,
  ): void => {
    setQuizAnswers((prev) => ({
      ...prev,
      [sectionIndex]: {
        ...prev[sectionIndex],
        [questionIndex]: answerIndex,
      },
    }));
  };
  const submitQuiz = (sectionIndex: number): void => {
    setQuizSubmitted((prev) => ({ ...prev, [sectionIndex]: true }));
  };

  const renderMarkdown = (content: string): JSX.Element => {
    const html = marked.parse(content) as string;
    const sanitizedHtml = DOMPurify.sanitize(html);
    return (
      <div
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        className="prose prose-indigo max-w-none"
        style={{
          fontFamily: '"Fira Code", "Fira Mono", monospace',
          fontSize: 14,
        }}
      />
    );
  };

  const toggleOverview = (): void => {
    setIsOverviewExpanded(!isOverviewExpanded);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gray-50">
      <div className="border-b bg-white p-3">
        <h1 className="mb-2 text-lg font-bold text-indigo-900">
          {course.overview?.title || "Generating course..."}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {sessionId && (
            <Link
              href={`https://us.helicone.ai/sessions/${encodeURIComponent(
                SESSION_NAME,
              )}/${encodeURIComponent(sessionId)}`}
              className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
            >
              View Session
            </Link>
          )}

          <Link
            href="https://us.helicone.ai/prompts"
            className="rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700"
          >
            View Prompts
          </Link>
          <button
            onClick={toggleOverview}
            className="flex items-center rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
          >
            {isOverviewExpanded ? "Hide" : "Show"} Description
            {isOverviewExpanded ? (
              <ChevronUpIcon className="ml-1 h-3 w-3" />
            ) : (
              <ChevronDownIcon className="ml-1 h-3 w-3" />
            )}
          </button>
        </div>
        {isOverviewExpanded && (
          <p className="mt-2 text-xs text-gray-600">
            {course.overview?.description ||
              "Please wait while we create your course."}
          </p>
        )}
      </div>

      {isGenerating && (
        <div className="bg-blue-100 p-2 text-xs text-blue-700">
          <p>{currentStep}</p>
        </div>
      )}

      <div className="flex-grow space-y-3 overflow-y-auto p-3">
        {course.sections?.map((section, index) => (
          <div
            key={index}
            className="overflow-hidden rounded bg-white shadow-sm"
          >
            <button
              className="w-full bg-indigo-50 p-2 text-left transition-colors duration-200 hover:bg-indigo-100"
              onClick={() =>
                setActiveSection(activeSection === index ? null : index)
              }
            >
              <h2 className="text-sm font-medium text-indigo-900">
                {index + 1}. {section.title}
              </h2>
            </button>
            {activeSection === index && (
              <div className="p-2 text-xs">
                {renderMarkdown(section.content)}

                {course.quizzes && course.quizzes[index] && (
                  <div className="mt-3 rounded bg-gray-50 p-2">
                    <h3 className="mb-2 text-sm font-medium text-indigo-900">
                      Quiz
                    </h3>
                    {course.quizzes[index].questions.map((q, qIndex) => (
                      <div key={qIndex} className="mb-3">
                        <p className="mb-1 font-medium">{q.question}</p>
                        {q.options.map((option, oIndex) => (
                          <div key={oIndex} className="mb-1 flex items-center">
                            <input
                              type="radio"
                              id={`q${qIndex}-o${oIndex}`}
                              name={`q${qIndex}`}
                              value={oIndex}
                              checked={quizAnswers[index]?.[qIndex] === oIndex}
                              onChange={() =>
                                handleQuizAnswer(index, qIndex, oIndex)
                              }
                              disabled={quizSubmitted[index]}
                              className="mr-1"
                            />
                            <label
                              htmlFor={`q${qIndex}-o${oIndex}`}
                              className="text-xs"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                        {quizSubmitted[index] && (
                          <p
                            className={`text-xs ${
                              quizAnswers[index]?.[qIndex] === q.correctAnswer
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {quizAnswers[index]?.[qIndex] === q.correctAnswer
                              ? "Correct!"
                              : `Incorrect. The correct answer is: ${
                                  q.options[q.correctAnswer]
                                }`}
                          </p>
                        )}
                      </div>
                    ))}
                    {!quizSubmitted[index] && (
                      <button
                        onClick={() => submitQuiz(index)}
                        className="mt-2 rounded bg-indigo-600 px-3 py-1 text-xs text-white transition-colors duration-200 hover:bg-indigo-700"
                      >
                        Submit Quiz
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TextbookCourse;
