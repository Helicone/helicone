import { generateText } from "ai";
import { v4 as uuidv4 } from "uuid";
import {
  Message,
  DebateNode,
  DebateSimulationConfig,
  DebateSimulationResult,
  ProgressCallback,
  SimulationUpdate,
  DebatePath,
  NodeScore,
  ResearchData,
  ApiUsageEstimate,
} from "./types";
import { conductResearch, sendProgressUpdate } from "./research";
import { openrouter, GEMINI_MODEL } from "./api-clients";

/**
 * Estimates API usage based on simulation configuration
 */
export function estimateApiUsage(
  config: DebateSimulationConfig
): ApiUsageEstimate {
  const { maxDepth, branchingFactor } = config;

  // Calculate total nodes in the tree
  let totalNodes = 0;
  for (let i = 0; i < maxDepth; i++) {
    totalNodes += Math.pow(branchingFactor, i);
  }

  // Each node requires a Gemini call to generate
  const geminiCalls = totalNodes;

  // We need one Perplexity call per turn for research
  const perplexityCalls = maxDepth;

  // Estimate cost (placeholder values, adjust based on actual pricing)
  const geminiCostPerCall = 0.0001; // $0.0001 per call
  const perplexityCostPerCall = 0.01; // $0.01 per call
  const estimatedCost =
    geminiCalls * geminiCostPerCall + perplexityCalls * perplexityCostPerCall;

  // Estimate time (assuming parallel execution where possible)
  const geminiTimePerCall = 2; // 2 seconds per call
  const perplexityTimePerCall = 5; // 5 seconds per call
  const estimatedTimeSeconds =
    maxDepth * perplexityTimePerCall +
    geminiTimePerCall * Math.log2(totalNodes + 1);

  return {
    perplexityCalls,
    geminiCalls,
    estimatedCost,
    estimatedTimeSeconds,
  };
}

/**
 * Runs a debate simulation to find the optimal response
 */
export async function runDebateSimulation(
  config: DebateSimulationConfig
): Promise<DebateSimulationResult> {
  const {
    messages,
    topic,
    maxDepth,
    branchingFactor,
    progressCallback,
    userStartsDebate,
  } = config;

  try {
    // Send initial progress update
    sendProgressUpdate(progressCallback, {
      status: "starting",
      message: "Starting debate simulation...",
      progress: 0,
    });

    // Conduct initial research on the topic
    const research = await conductResearch(
      topic.topic,
      topic.stance,
      messages,
      progressCallback
    );

    // Create the root node of the simulation tree
    const rootNode: DebateNode = {
      id: uuidv4(),
      text: userStartsDebate
        ? "User starts the debate"
        : "AI starts the debate",
      score: 0,
      children: [],
      isUserStance: userStartsDebate,
      context: messages,
      depth: 0,
      parentId: null,
    };

    // If AI starts the debate, generate the initial response
    if (!userStartsDebate) {
      const initialResponse = await generateInitialResponse(
        topic,
        messages,
        research.researchData,
        progressCallback
      );

      rootNode.text = initialResponse;

      // We no longer return early here - instead we continue to explore the tree
    }

    // Explore the debate tree to find the best response path
    await exploreDebateTree(
      rootNode,
      topic,
      messages,
      research.researchData,
      maxDepth,
      branchingFactor,
      progressCallback
    );

    // Find the best path in the tree
    const bestPath = findBestPath(rootNode);

    // The best response is the first node in the best path (after the root)
    const bestResponse =
      bestPath.nodes.length > 1
        ? bestPath.nodes[1].text
        : "Unable to determine the best response";

    // Send final progress update
    sendProgressUpdate(progressCallback, {
      status: "completed",
      message: "Debate simulation completed",
      progress: 100,
      partialTree: rootNode,
      researchData: research.researchData,
    });

    return {
      bestResponse,
      simulationTree: rootNode,
      bestPath,
      researchData: research.researchData,
    };
  } catch (error) {
    console.error("Debate simulation error:", error);

    // Send error progress update
    sendProgressUpdate(progressCallback, {
      status: "error",
      message: `Simulation failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      progress: 0,
    });

    throw new Error(
      `Debate simulation failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Generates the initial response to start the debate
 */
async function generateInitialResponse(
  topic: DebateSimulationConfig["topic"],
  messages: Message[],
  researchData: ResearchData,
  progressCallback?: ProgressCallback
): Promise<string> {
  try {
    sendProgressUpdate(progressCallback, {
      status: "generating_responses",
      message: "Generating initial response...",
      progress: 20,
    });

    const persona = topic.opponent
      ? `You are ${topic.opponent}.`
      : "You are a friendly AI assistant.";
    const stance = topic.stance === "for" ? "against" : "for";

    // Format sources for citation with markdown links
    const sourcesFormatted = researchData.sources
      .map((source, index) => {
        const title = source.title || "Untitled";
        const url = source.url || "#";
        return `[${index + 1}] [${title}](${url})`;
      })
      .join("\n");

    const response = await generateText({
      model: openrouter(GEMINI_MODEL),
      prompt: `Respond to the user's request to debate the topic: "${
        topic.topic
      }".
      
You should take the "${stance}" position in this conversation.

Use the following research to inform your response:

Analysis:
${researchData.analysis}

Supporting Evidence:
${researchData.supportingEvidence.map((e) => `- ${e}`).join("\n")}

Counter Evidence:
${researchData.counterEvidence.map((e) => `- ${e}`).join("\n")}

Historical Context:
${researchData.historicalContext || ""}

Summary:
${researchData.summary}

Available sources for citation:
${researchData.sources
  .map((source, index) => {
    const title = source.title || "Untitled";
    const url = source.url || "#";
    return `[${index + 1}] ${title}: ${url}`;
  })
  .join("\n")}

Your response should be:
1. Conversational and natural, as if you're having a friendly discussion
2. Avoid formal debate language like "esteemed judges" or "worthy opponents"
3. Present your points clearly but in a casual, engaging way
4. Keep your response concise (1-2 paragraphs)
5. Use a friendly, approachable tone
6. DO NOT start your response with "Hey!" or similar generic greetings
7. Use a unique, distinctive writing style
8. Avoid clichés and overused phrases
9. Include 2-3 citations from the sources provided using markdown format: [[1]](url), [[2]](url), etc.
10. Make sure the citations are relevant to the points you're making`,
      temperature: 1.0, // Higher temperature for more creative responses
      maxTokens: 1000,
      system: `${persona} You are having a casual conversation about a debate topic. Your goal is to present your perspective in a friendly, conversational manner. Be engaging, thoughtful, and natural in your responses. Avoid overly formal debate language. Use a unique writing style that feels authentic and distinctive. Include citations from the provided sources using markdown format: [[1]](url), [[2]](url), etc. to support your arguments.`,
    });

    // Append the sources as references at the end of the response with markdown links
    const responseWithSources = `${response.text}

References:
${sourcesFormatted}`;

    return responseWithSources;
  } catch (error) {
    console.error("Error generating initial response:", error);
    throw new Error(
      `Failed to generate initial response: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Explores the debate tree by generating responses and scoring them
 */
async function exploreDebateTree(
  rootNode: DebateNode,
  topic: DebateSimulationConfig["topic"],
  messages: Message[],
  researchData: ResearchData,
  maxDepth: number,
  branchingFactor: number,
  progressCallback?: ProgressCallback
): Promise<void> {
  // Queue for breadth-first exploration
  const queue: { node: DebateNode; depth: number }[] = [
    { node: rootNode, depth: 0 },
  ];

  // Track progress
  let totalNodes = 0;
  for (let i = 0; i < maxDepth; i++) {
    totalNodes += Math.pow(branchingFactor, i);
  }
  let processedNodes = 0;

  // Process nodes in breadth-first order
  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;

    // Stop if we've reached the maximum depth
    if (depth >= maxDepth) continue;

    // Generate child nodes
    const children = await generateResponses(
      node,
      topic,
      messages,
      researchData,
      branchingFactor,
      depth,
      progressCallback
    );

    // Add children to the node
    node.children = children;

    // Add children to the queue
    for (const child of children) {
      queue.push({ node: child, depth: depth + 1 });
    }

    // Update progress
    processedNodes++;
    const progress = Math.min(90, 30 + (processedNodes / totalNodes) * 60);

    sendProgressUpdate(progressCallback, {
      status: "exploring_tree",
      message: `Exploring debate tree (depth ${depth + 1}/${maxDepth})...`,
      progress,
      partialTree: rootNode,
    });
  }

  // Score all paths in the tree
  await scoreDebatePaths(rootNode, topic, progressCallback);
}

/**
 * Generates possible responses for a node in the debate tree
 */
async function generateResponses(
  parentNode: DebateNode,
  topic: DebateSimulationConfig["topic"],
  messages: Message[],
  researchData: ResearchData,
  count: number,
  currentDepth: number,
  progressCallback?: ProgressCallback
): Promise<DebateNode[]> {
  try {
    // Create a prompt for generating responses
    const isUserStance = parentNode.isUserStance;
    const stance = isUserStance
      ? topic.stance === "for"
        ? "against"
        : "for"
      : topic.stance;
    const persona = isUserStance
      ? topic.opponent
        ? `You are ${topic.opponent}.`
        : "You are a friendly AI assistant."
      : "You are the user.";

    // Format sources for citation with markdown links
    const sourcesFormatted = researchData.sources
      .map((source, index) => {
        const title = source.title || "Untitled";
        const url = source.url || "#";
        return `[${index + 1}] [${title}](${url})`;
      })
      .join("\n");

    // Generate multiple responses
    const responses: DebateNode[] = [];

    for (let i = 0; i < count; i++) {
      try {
        // Generate a response
        const prompt = `Respond to the following message in a casual, conversational way:

Topic of discussion: "${topic.topic}"

Previous message: "${parentNode.text}"

${
  researchData.analysis
    ? `Research analysis (use this information but don't explicitly reference it): ${researchData.analysis.substring(
        0,
        500
      )}...`
    : ""
}

${
  isUserStance && researchData.supportingEvidence.length > 0
    ? `Supporting evidence (use this information but don't explicitly reference it): ${researchData.supportingEvidence
        .slice(0, 3)
        .join("\n")}`
    : ""
}

${
  isUserStance && researchData.counterEvidence.length > 0
    ? `Counter evidence (use this information but don't explicitly reference it): ${researchData.counterEvidence
        .slice(0, 3)
        .join("\n")}`
    : ""
}

Available sources for citation:
${researchData.sources
  .map((source, index) => {
    const title = source.title || "Untitled";
    const url = source.url || "#";
    return `[${index + 1}] ${title}: ${url}`;
  })
  .join("\n")}

Your response should:
1. Present a perspective that ${
          isUserStance ? "disagrees with" : "supports"
        } the topic
2. Be conversational and natural, as if you're chatting with a friend
3. Avoid formal debate language or structure
4. Respond directly to what was said in the previous message
5. Keep your response concise (1-2 paragraphs)
6. Use a friendly, approachable tone
7. IMPORTANT: Make your response VERY DIFFERENT from other responses. Use a unique writing style, different arguments, and different examples.
8. DO NOT start your response with "Hey!" or similar greetings - use a variety of conversation starters.
9. Use a variety of sentence structures and vocabulary.
10. Include 1-2 citations from the sources provided using markdown format: [[1]](url), [[2]](url), etc.
11. Make sure the citations are relevant to the points you're making

This is response variation ${i + 1} of ${count}.`;

        try {
          const response = await generateText({
            model: openrouter(GEMINI_MODEL),
            prompt,
            temperature: 1.0 + i * 0.2, // Higher temperature for more variation
            maxTokens: 500,
            system: `${persona} You are having a casual conversation about a debate topic. Your goal is to present your perspective in a friendly, conversational manner. Be engaging, thoughtful, and natural in your responses. Avoid overly formal debate language. IMPORTANT: Each of your responses should be VERY DIFFERENT from each other in style, tone, and content. Use different arguments, examples, and writing styles for each response. Include citations from the provided sources using markdown format: [[1]](url), [[2]](url), etc. to support your arguments.`,
          });

          // Append the sources as references at the end of the response with markdown links
          const responseWithSources = `${response.text}

References:
${sourcesFormatted}`;

          // Create a new node
          const node: DebateNode = {
            id: uuidv4(),
            text: responseWithSources,
            isUserStance: !parentNode.isUserStance,
            children: [],
            score: 0,
            context: [...(parentNode.context || [])],
            depth: (parentNode.depth || 0) + 1,
            parentId: parentNode.id,
          };

          responses.push(node);
        } catch (error) {
          console.error(`Error generating response ${i + 1}:`, error);

          // Check if it's a payment/credits error
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (
            errorMessage.includes("Payment Required") ||
            errorMessage.includes("Insufficient credits") ||
            errorMessage.includes("402")
          ) {
            // Create a fallback node with a placeholder response
            const fallbackNode: DebateNode = {
              id: uuidv4(),
              text: `I see your point about ${topic.topic}. While I understand where you're coming from, I have a different perspective. [API limit reached - this would normally contain a thoughtful response to your message.]`,
              isUserStance: !parentNode.isUserStance,
              children: [],
              score: 0,
              context: [...(parentNode.context || [])],
              depth: (parentNode.depth || 0) + 1,
              parentId: parentNode.id,
            };

            responses.push(fallbackNode);
          }

          // If we have at least one response, continue
          if (responses.length > 0 && i >= Math.min(2, count - 1)) {
            break;
          }
        }
      } catch (innerError) {
        console.error(`Error in response generation loop:`, innerError);
      }
    }

    // If we couldn't generate any responses, throw an error
    if (responses.length === 0) {
      throw new Error("Failed to generate any responses");
    }

    return responses;
  } catch (error) {
    console.error("Error generating responses:", error);
    throw new Error(
      `Failed to generate responses: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Scores all paths in the debate tree
 */
async function scoreDebatePaths(
  rootNode: DebateNode,
  topic: DebateSimulationConfig["topic"],
  progressCallback?: ProgressCallback
): Promise<void> {
  sendProgressUpdate(progressCallback, {
    status: "scoring_paths",
    message: "Scoring debate paths...",
    progress: 90,
    partialTree: rootNode,
  });

  // Score each node in the tree
  await scoreNode(rootNode, topic);

  // Propagate scores up the tree
  propagateScores(rootNode);
}

/**
 * Scores a single node in the debate tree
 */
async function scoreNode(
  node: DebateNode,
  topic: DebateSimulationConfig["topic"]
): Promise<void> {
  // Skip scoring the root node
  if (node.depth === 0) {
    node.score = 0;
  } else {
    // Score this node
    const nodeScore = await evaluateResponse(node, topic);
    node.score = nodeScore.score;
  }

  // Score children recursively
  for (const child of node.children) {
    await scoreNode(child, topic);
  }
}

/**
 * Evaluates a response in the debate
 */
async function evaluateResponse(
  node: DebateNode,
  topic: DebateSimulationConfig["topic"]
): Promise<NodeScore> {
  try {
    const stance = node.isUserStance
      ? topic.stance
      : topic.stance === "for"
      ? "against"
      : "for";

    // Build context from node
    const context = node.context
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");
    const response = node.text;

    // Evaluate the response
    const evaluation = await generateText({
      model: openrouter(GEMINI_MODEL),
      prompt: `Evaluate the following response in a debate on the topic: "${topic.topic}".
      
The response is from someone taking the "${stance}" position.

Previous context:
${context}

Response to evaluate:
${response}

Score this response on a scale from 1 to 10, where:
1 = Very weak, ineffective, contains logical fallacies or factual errors
5 = Average, somewhat persuasive but with room for improvement
10 = Exceptional, highly persuasive, well-reasoned, and effectively supported

Provide your score and a brief explanation of your reasoning.

Format your response as a JSON object:
{
  "score": 7,
  "reasoning": "Explanation of why this score was given..."
}`,
      temperature: 0.3,
      maxTokens: 500,
      system: `You are an expert debate judge. Your task is to evaluate debate responses objectively based on their persuasiveness, logical coherence, use of evidence, and rhetorical effectiveness. Provide a fair assessment regardless of your personal views on the topic.`,
    });

    // Parse the evaluation
    try {
      const parsedEvaluation = JSON.parse(evaluation.text);
      return {
        score: parsedEvaluation.score || 5, // Default to 5 if parsing fails
        reasoning: parsedEvaluation.reasoning || "No reasoning provided",
      };
    } catch (error) {
      console.error("Error parsing evaluation:", error);
      return { score: 5, reasoning: "Failed to parse evaluation" };
    }
  } catch (error) {
    console.error("Error evaluating response:", error);
    return { score: 5, reasoning: "Evaluation failed due to an error" };
  }
}

/**
 * Propagates scores up the tree
 */
function propagateScores(node: DebateNode): number {
  // If this is a leaf node, return its score
  if (node.children.length === 0) {
    return node.score;
  }

  // Calculate the maximum score among children
  let maxChildScore = -Infinity;
  for (const child of node.children) {
    const childScore = propagateScores(child);
    maxChildScore = Math.max(maxChildScore, childScore);
  }

  // Update the node's score to include the best child path
  node.score += maxChildScore;

  return node.score;
}

/**
 * Finds the best path in the debate tree
 */
function findBestPath(rootNode: DebateNode): DebatePath {
  const path: DebateNode[] = [rootNode];
  let currentNode = rootNode;
  let totalScore = rootNode.score;

  // Follow the highest-scoring child at each step
  while (currentNode.children.length > 0) {
    let bestChild: DebateNode | null = null;
    let bestScore = -Infinity;

    for (const child of currentNode.children) {
      if (child.score > bestScore) {
        bestScore = child.score;
        bestChild = child;
      }
    }

    if (bestChild) {
      path.push(bestChild);
      totalScore += bestChild.score;
      currentNode = bestChild;
    } else {
      break;
    }
  }

  return { nodes: path, totalScore };
}
