import { useState, useEffect } from "react";
import { marked } from "marked";
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
import { useRouter } from "next/router";

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
  const router = useRouter();

  useEffect(() => {
    const renderer = new marked.Renderer();

    renderer.code = ({ text, lang, escaped }) => {
      const language = lang && languages[lang] ? lang : "markdown";
      const highlightedCode = highlight(
        text,
        languages[language] || languages.markdown,
        language
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
    answerIndex: number
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
    const html = marked(content);
    return (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
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
    <div className="w-full h-full flex flex-col overflow-hidden bg-gray-50">
      <div className="p-3 bg-white border-b">
        <h1 className="text-lg font-bold text-indigo-900 mb-2">
          {course.overview?.title || "Generating course..."}
        </h1>
        <div className="flex flex-wrap gap-2 items-center">
          {sessionId && (
            <Link
              href={`https://us.helicone.ai/sessions/${sessionId}`}
              className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              View Session
            </Link>
          )}

          <Link
            href="https://us.helicone.ai/prompts"
            className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            View Prompts
          </Link>
          <button
            onClick={toggleOverview}
            className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 flex items-center"
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
          <p className="text-xs text-gray-600 mt-2">
            {course.overview?.description ||
              "Please wait while we create your course."}
          </p>
        )}
      </div>

      {isGenerating && (
        <div className="p-2 bg-blue-100 text-blue-700 text-xs">
          <p>{currentStep}</p>
        </div>
      )}

      <div className="flex-grow overflow-y-auto p-3 space-y-3">
        {course.sections?.map((section, index) => (
          <div
            key={index}
            className="bg-white rounded shadow-sm overflow-hidden"
          >
            <button
              className="w-full text-left p-2 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
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
                  <div className="mt-3 p-2 bg-gray-50 rounded">
                    <h3 className="text-sm font-medium mb-2 text-indigo-900">
                      Quiz
                    </h3>
                    {course.quizzes[index].questions.map((q, qIndex) => (
                      <div key={qIndex} className="mb-3">
                        <p className="font-medium mb-1">{q.question}</p>
                        {q.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center mb-1">
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
                        className="mt-2 px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors duration-200"
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
