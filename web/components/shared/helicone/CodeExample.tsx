import React from "react";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";

const CodeExamples = {
  webhook: {
    code: `export default async function handler(req, res) {
  const { request_id, request_body, response_body } = req.body;

  // Do something with the data!
  console.log("LLM Log: ", request_body, response_body);

  // Your business logic here...
  return res.status(200).json({ success: true });
}`,
    language: "javascript",
    image: "/static/featureUpgrade/webhook.webp",
    alt: "Webhook",
    offset: "mt-[135px]",
  },
  properties: {
    code: `"Helicone-Property-UserType": "premium",
"Helicone-Property-Feature": "content_generation",
"Helicone-Property-Department": "marketing",
"Helicone-Property-Region": "north_america",
"Helicone-Property-UseCase": "email_campaign"`,
    language: "javascript",
    image: "/static/featureUpgrade/custom-property.webp",
    alt: "Properties",
    offset: "mt-[-50px]",
  },
} as const;

export type CodeExampleKey = keyof typeof CodeExamples;

export const CodeExample = (codeExampleKey: CodeExampleKey) => {
  const codeExample = CodeExamples[codeExampleKey];

  return (
    <div className="w-full md:w-[568.25px] h-full relative rounded-lg overflow-hidden">
      {/* Background Image */}
      <img
        src={codeExample.image}
        alt={codeExample.alt}
        className="w-full h-full object-cover"
      />

      {/* Code Section with Transparent Background */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${codeExample.offset}`}
      >
        <DiffHighlight
          code={codeExample.code}
          language={codeExample.language}
          newLines={[]}
          oldLines={[]}
          minHeight={false}
          maxHeight={false}
          textSize="md"
          className="bg-[#1a1b26] rounded-lg [&_pre]:py-4"
          marginTop={false}
        />
      </div>
    </div>
  );
};
