import React from "react";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";

type CodeExampleType = {
  code: string;
  language: string;
  image?: string;
  alt: string;
  offset?: string;
};

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
  users: {
    code: `"Helicone-User-Id": "john@doe.com"`,
    language: "javascript",
    image: "/static/featureUpgrade/user-metric.webp",
    alt: "Users",
    offset: "mt-64",
  },
} as const satisfies Record<string, CodeExampleType>;

export type CodeExampleKey = keyof typeof CodeExamples;

export const CodeExample = (codeExampleKey: CodeExampleKey) => {
  const codeExample = CodeExamples[codeExampleKey] as CodeExampleType;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg md:w-[568.25px]">
      {/* Background Image */}
      {codeExample.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={codeExample.image}
          alt={codeExample.alt}
          className="h-full w-full object-cover"
        />
      )}

      {/* Code Section - Always render even without image */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${
          codeExample.offset ?? ""
        }`}
      >
        <DiffHighlight
          code={codeExample.code}
          language={codeExample.language}
          newLines={[]}
          oldLines={[]}
          minHeight={false}
          maxHeight={false}
          textSize="md"
          className="rounded-lg bg-[#1a1b26] [&_pre]:py-4"
          marginTop={false}
        />
      </div>
    </div>
  );
};
