import React from "react";

interface QuestionsProps {}

export function Questions({}: QuestionsProps) {
  return (
    <>
      <hr className="w-full max-w-4xl mx-auto border-t border-slate-200" />
      <section className="w-full max-w-4xl mx-auto mt-6 mb-2">
        <h3 className="font-bold text-2xl text-gray-700">
          Questions or feedback?
        </h3>
        <p className="text-base text-gray-500">
          Are the information out of date? Please{" "}
          <a
            href="https://github.com/Helicone/helicone/issues"
            rel="noopener"
            target="_blank"
          >
            raise an issue
          </a>{" "}
          or{" "}
          <a
            href="https://www.helicone.ai/contact"
            rel="noopener"
            target="_blank"
          >
            contact us
          </a>
          , we'd love to hear from you!
        </p>
      </section>
    </>
  );
}
