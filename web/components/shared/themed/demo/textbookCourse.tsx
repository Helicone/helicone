import React, { useState, useEffect } from "react";
import { marked } from "marked";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-markup-templating";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";

const TextbookCourse = ({ course, isGenerating, currentStep }) => {
  const [activeSection, setActiveSection] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState({});
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

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

  const handleQuizAnswer = (sectionIndex, questionIndex, answerIndex) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [sectionIndex]: {
        ...prev[sectionIndex],
        [questionIndex]: answerIndex,
      },
    }));
  };

  const submitQuiz = (sectionIndex) => {
    setQuizSubmitted((prev) => ({ ...prev, [sectionIndex]: true }));
  };

  const renderMarkdown = (content) => {
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

  const toggleOverview = () => {
    setIsOverviewExpanded(!isOverviewExpanded);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gray-50">
      <div className="p-6 bg-white border-b">
        <h1 className="text-3xl font-bold text-indigo-900">
          {course.overview?.title || "Generating course..."}
        </h1>
        <div className="mt-2">
          <button
            onClick={toggleOverview}
            className="text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none"
          >
            {isOverviewExpanded ? "Hide Description" : "Show Description"}
          </button>
          {isOverviewExpanded && (
            <p className="text-sm text-gray-600 mt-2">
              {course.overview?.description ||
                "Please wait while we create your course."}
            </p>
          )}
        </div>
      </div>

      {isGenerating && (
        <div className="p-3 bg-blue-100 text-blue-700 text-sm font-medium">
          <p>{currentStep}</p>
        </div>
      )}

      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {course.sections?.map((section, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <button
              className="w-full text-left p-4 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
              onClick={() =>
                setActiveSection(activeSection === index ? null : index)
              }
            >
              <h2 className="text-xl font-semibold text-indigo-900">
                {index + 1}. {section.title}
              </h2>
            </button>
            {activeSection === index && (
              <div className="p-4 space-y-4">
                {renderMarkdown(section.content)}

                {course.quizzes && course.quizzes[index] && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4 text-indigo-900">
                      Quiz
                    </h3>
                    {course.quizzes[index].questions.map((q, qIndex) => (
                      <div key={qIndex} className="mb-6">
                        <p className="font-medium mb-2">{q.question}</p>
                        {q.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center mb-2">
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
                              className="mr-2"
                            />
                            <label htmlFor={`q${qIndex}-o${oIndex}`}>
                              {option}
                            </label>
                          </div>
                        ))}
                        {quizSubmitted[index] && (
                          <p
                            className={
                              quizAnswers[index]?.[qIndex] === q.correctAnswer
                                ? "text-green-600"
                                : "text-red-600"
                            }
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
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors duration-200"
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
