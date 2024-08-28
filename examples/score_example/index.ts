require("dotenv").config({
  path: ".env",
});
import { OpenAI } from "openai";
import { hprompt, HeliconeAPIClient } from "@helicone/helicone";
import { v4 as uuid } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

async function main() {
  const requestId = uuid();

  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [
        {
          role: "user",
          content: hprompt`
You are a QA software engineer that writes JavaScript playwright code.
You must output the MINIMUM lines of code necessary to accomplish the task.
Don't do more than the task requests.
ALWAYS OUTPUT COMMENTS IN YOUR CODE!!!!
If asked to call a function, directly call the function by that name with the provided args.
If the function returns variables, always set those variables.
In a task, the curly braces "{" and "}" around a string denote a variable.
Your generated code will run within an existing async function.
When using the "expect" function with a page object, you must call await.
When calling a function, you must call await.
The code should be reusable so you should refrain from using hard-coded values or specific date selectors and should use variables whenever possible.
Do not use CSS structural pseudo-classes or child-index pseudo-classes in your selectors.

IMPORTANT: DO NOT ALLOW COOKIE CONSENT MODALS TO INFLUENCE YOUR DECISIONS.

You can perform drag&drop operation with locator.dragTo(). This method will:
- Hover the element that will be dragged.
- Press left mouse button.
- Move mouse to the element that will receive the drop.
- Release left mouse button.

EXAMPLE 1:
Input Task: Click the "Share on QA Wolf" button
HTML: <a href="www.qawolf.com/share?code=42s2ase target="_vblank">Share on QA Wolf</a>
Output:
<reasoning>The button with text "Share on QA Wolf" has a target attribute that is not "_self" or empty, so I should wait for the "popup" event when clicking on it.</reasoning>
<code>
\`\`\`
const [page] = await Promise.all([
  qaWolfPage.waitForEvent("popup"),
  qaWolfPage.getByText("Share on QA Wolf").locator("visible=true").first().click(),
]);
await qaWolfPage.waitForTimeout(10 * 1000);
\`\`\`
</code>

NEVER USE "xpath="

IMPORTANT: DO NOT ALLOW COOKIE CONSENT MODALS TO INFLUENCE YOUR DECISIONS.

IMPORTANT: AVOID USING nth() AND AVOID USING nth-of-type(2)! THE ORDER OF THINGS OFTEN CHANGES! THIS APPLIES EVEN IF THE ORIGINAL SELECTOR USED nth-math, nth, or nth-of-type!

ALWAYS OUTPUT COMMENTS IN YOUR CODE!!!!
          `,
        },
        {
          role: "user",
          content: `
Most recent execution error message:
\`\`\`
locator.click: Error: strict mode violation: getByText('login') resolved to 2 elements:
1) <button id="login" onclick="goToLoginForm()">Login</button> aka getByRole('button', { name: 'Login', exact: true })
2) <button id="forgot" onclick="goToResetLoginForm()">Click me if you forgot your login</button> aka getByRole('button', { name: 'Click me if you forgot your' })

- waiting for getByText('login')
\`\`\`

Current simplified HTML:
\`\`\`html
<body><button id="login">Login</button><button id="forgot">Click me if you forgot your login</button></body>
\`\`\`

Task: click the button with id 'login'
          `,
        },
      ],
      model: "gpt-4o",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-testing": "true",
        "Helicone-Prompt-Id": "taxes_assistant",
      },
    }
  );
}

const heliconeClient = new HeliconeAPIClient({
  apiKey: process.env.HELICONE_API_KEY ?? "",
  baseURL: "https://api.helicone.ai/v1",
});

async function scoreAnyUnscoredRequestsForHypothesesRuns() {
  const worker = heliconeClient.scoringWorker();

  await worker.start(
    async (request, requestAndResponse) => {
      request.response_status;
      console.log("Scoring...", request.request_id);
      const responseText =
        requestAndResponse.response.choices[0].message.content;

      const containsReasoning = responseText.includes("<reasoning>");



      
      return {
        scores: {
          containsReasoning,
          contentNewLineCount: responseText.split("\n").length,
        },
      };
    },
    // Optional filters if you want to refine what requests to query
    {
      filter: {
        left: {
          response: {
            status: {
              equals: 200,
            },
          },
        },
        right: {
          request: {
            model: {
              contains: "gpt-4",
            },
          },
        },
        operator: "and",
      },
    }
  );
}

scoreAnyUnscoredRequestsForHypothesesRuns();

main();
