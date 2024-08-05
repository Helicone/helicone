import React, { useState } from "react";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-markup-templating";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";

const TextbookCourse = ({ course, isGenerating, currentStep }) => {
  const [activeSection, setActiveSection] = useState(null);

  const shortDescription =
    course.overview?.description.slice(0, 150) +
    (course.overview?.description.length > 150 ? "..." : "");

  const renderContent = (content) => {
    const htmlContent = parseMarkdown(content);
    return (
      <div
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        className="prose max-w-none"
      />
    );
  };

  const parseMarkdown = (markdown) => {
    // This is a simple markdown parser. You might want to use a more robust solution for a production app.
    let html = markdown
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gim, "<em>$1</em>")
      .replace(/\n/gim, "<br>");

    // Handle code blocks
    html = html.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (match, language, code) => {
        const highlightedCode = highlight(
          code,
          languages[language] || languages.markup,
          "markdown"
        );
        return `<pre class="language-${
          language || "markup"
        }"><code>${highlightedCode}</code></pre>`;
      }
    );

    return html;
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="p-4 bg-white border-b">
        <h1 className="text-2xl font-bold">
          {course.overview?.title || "Generating course..."}
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          {shortDescription || "Please wait while we create your course."}
        </p>
      </div>

      {isGenerating && (
        <div className="p-2 bg-blue-100 text-blue-700 text-sm">
          <p>{currentStep}</p>
        </div>
      )}

      <div className="flex-grow overflow-y-auto p-4">
        {course.sections?.map((section, index) => (
          <div key={index} className="mb-4">
            <button
              className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded"
              onClick={() =>
                setActiveSection(activeSection === index ? null : index)
              }
            >
              <h2 className="text-lg font-semibold">
                {index + 1}. {section.title}
              </h2>
            </button>
            {activeSection === index && (
              <div className="mt-2 p-2">
                {renderContent(section.content)}

                {course.quizzes && course.quizzes[index] && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Quiz</h3>
                    {course.quizzes[index].questions.map((q, qIndex) => (
                      <div key={qIndex} className="mb-2">
                        {renderContent(
                          `**Q${qIndex + 1}:** ${q.question}\n\n${q.options
                            .map(
                              (option, oIndex) =>
                                `${
                                  oIndex === q.correctAnswer ? "**" : ""
                                }- ${option}${
                                  oIndex === q.correctAnswer ? "**" : ""
                                }`
                            )
                            .join("\n")}`
                        )}
                      </div>
                    ))}
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
