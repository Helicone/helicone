"use client";

import { ISLAND_WIDTH } from "@/app/page";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ArrowUpRightIcon, PlusIcon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
} from "../ui/table";
import { useState, useCallback, useEffect, useRef } from "react";

const data: {
  messages: string;
  original: string;
  prompt1: string;
  prompt2: string;
}[] = [
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `This beginner-level co...`,
    prompt1: `In this five-session begi...`,
    prompt2: `Through five practical s...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `This beginner-level co...`,
    prompt1: `In this five-session begi...`,
    prompt2: `Through five practical s...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `This beginner-level co...`,
    prompt1: `In this five-session begi...`,
    prompt2: `Through five practical s...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `This beginner-level co...`,
    prompt1: `In this five-session begi...`,
    prompt2: `Through five practical s...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `This beginner-level co...`,
    prompt1: `In this five-session begi...`,
    prompt2: `Through five practical s...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `This beginner-level co...`,
    prompt1: `In this five-session begi...`,
    prompt2: `Through five practical s...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `This beginner-level co...`,
    prompt1: `In this five-session begi...`,
    prompt2: `Through five practical s...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `This beginner-level co...`,
    prompt1: `In this five-session begi...`,
    prompt2: `Through five practical s...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `This beginner-level co...`,
    prompt1: `In this five-session begi...`,
    prompt2: `Through five practical s...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `This beginner-level co...`,
    prompt1: `In this five-session begi...`,
    prompt2: `Through five practical s...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `This beginner-level co...`,
    prompt1: `In this five-session begi...`,
    prompt2: `Through five practical s...`,
  },
];

const ExperimentTable = () => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [animationState, setAnimationState] = useState(() =>
    Array(data.length)
      .fill(0)
      .map(() => Array(4).fill(0))
  );
  const [highlightState, setHighlightState] = useState(() =>
    Array(data.length)
      .fill(0)
      .map(() => Array(4).fill(false))
  );

  // Set up intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1, // Trigger when at least 10% of the element is visible
      }
    );

    if (tableRef.current) {
      observer.observe(tableRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Start animation when table becomes visible
  useEffect(() => {
    if (isVisible && !hasStarted) {
      setHasStarted(true);
      startAnimation();
    }
  }, [isVisible]);

  const animateCell = useCallback((row: number, col: number) => {
    const generateTime = Math.random() * 500 + 500;

    setAnimationState((prev) => {
      const newState = prev.map((row) => [...row]);
      newState[row][col] = 1;
      return newState;
    });

    setTimeout(() => {
      setAnimationState((prev) => {
        const newState = prev.map((row) => [...row]);
        newState[row][col] = 2;
        return newState;
      });

      setHighlightState((prev) => {
        const newState = prev.map((row) => [...row]);
        newState[row][col] = true;
        return newState;
      });

      setTimeout(() => {
        setHighlightState((prev) => {
          const newState = prev.map((row) => [...row]);
          newState[row][col] = false;
          return newState;
        });
      }, 2000);
    }, generateTime);
  }, []);

  const startAnimation = useCallback(() => {
    setAnimationState(
      Array(data.length)
        .fill(0)
        .map(() => Array(4).fill(0))
    );
    setHighlightState(
      Array(data.length)
        .fill(0)
        .map(() => Array(4).fill(false))
    );

    data.forEach((_, rowIndex) => {
      [1, 2, 3].forEach((colIndex) => {
        const delay = (rowIndex * 3 + colIndex) * 300;
        setTimeout(() => animateCell(rowIndex, colIndex), delay);
      });
    });
  }, [animateCell]);

  // Only start the interval after initial visibility
  useEffect(() => {
    if (!hasStarted) return;

    const intervalId = setInterval(startAnimation, 15000);
    return () => clearInterval(intervalId);
  }, [startAnimation, hasStarted]);

  const getCellContent = (value: string, state: number) => {
    if (state === 0) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-700 rounded-full animate-pulse"></div>
          <div className="text-sm text-slate-700">Queued...</div>
        </div>
      );
    }
    if (state === 1) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-700 rounded-full animate-pulse"></div>
          <div className="text-sm text-slate-700">Generating...</div>
        </div>
      );
    }
    return value;
  };

  return (
    <div ref={tableRef} className="relative w-full h-full z-[1]">
      <div className="absolute inset-0 h-full w-full pointer-events-none bg-gradient-to-r from-white to-transparent z-[2]"></div>
      <div className="absolute h-[100px] w-full bottom-0 right-0 pointer-events-none bg-gradient-to-t from-white to-transparent z-[2]"></div>
      <div className="w-full h-full p-2 border border-slate-200 rounded-2xl overflow-hidden">
        <Table className="divide w-full table-fixed">
          <TableHeader className="bg-slate-100 rounded-t-2xl">
            <TableRow>
              <TableHead className="border-r border-slate-200 w-[25%]">
                Messages
              </TableHead>
              <TableHead className="border-r border-slate-200 w-[25%]">
                Original
              </TableHead>
              <TableHead className="border-r border-slate-200 w-[25%]">
                Prompt 1
              </TableHead>
              <TableHead className="border-r border-slate-200 w-[25%]">
                Prompt 2
              </TableHead>
              <TableHead className="text-center rounded-tr-2xl w-[40px]">
                <PlusIcon className="w-4 h-4" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="border-r border-slate-200 whitespace-nowrap overflow-hidden text-ellipsis">
                  {row.messages}
                </TableCell>
                <TableCell
                  className={cn(
                    "border-r border-slate-200 whitespace-nowrap overflow-hidden text-ellipsis",
                    highlightState[index][1] && "bg-slate-100"
                  )}
                >
                  {getCellContent(row.original, animationState[index][1])}
                </TableCell>
                <TableCell
                  className={cn(
                    "border-r border-slate-200 whitespace-nowrap overflow-hidden text-ellipsis",
                    highlightState[index][2] && "bg-slate-100"
                  )}
                >
                  {getCellContent(row.prompt1, animationState[index][2])}
                </TableCell>
                <TableCell
                  className={cn(
                    "border-r border-slate-200 whitespace-nowrap overflow-hidden text-ellipsis",
                    highlightState[index][3] && "bg-slate-100"
                  )}
                >
                  {getCellContent(row.prompt2, animationState[index][3])}
                </TableCell>
                <TableCell className="w-[40px]"></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const evals = [
  {
    category: "LLM as a judge",
    name: "Similarity",
    value: 77,
  },
  {
    category: "LLM as a judge",
    name: "Humor",
    value: 81,
  },
  {
    category: "LLM as a judge",
    name: "SQL",
    value: 94,
  },
  {
    category: "RAG",
    name: "ContextRecall",
    value: 63,
  },
  {
    category: "Composite",
    name: "StringContains",
    value: 98,
  },
];

const Experiment = () => {
  return (
    <div className={cn(ISLAND_WIDTH, "pt-28")}>
      <div className="flex flex-col gap-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8">
          <div className="flex flex-col gap-9 z-[10]">
            <div className="flex items-center gap-2.5">
              <p className="text-base sm:text-xl">03</p>
              <div className="text-base sm:text-lg font-medium text-slate-700">
                Experiment
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <h2 className="font-semibold text-4xl sm:text-5xl leading-[120%] max-w-[600px] text-wrap text-black">
                Push <span className="text-brand">high-quality</span> prompt
                changes to production
              </h2>
              <p className="text-lg max-w-[520px]">
                Tune your prompts and justify your iterations with quantifiable
                data, not just “vibes”.
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <a
                href="https://docs.helicone.ai/features/prompts"
                target="_blank"
              >
                <Button
                  className="items-center gap-2 text-landing-secondary self-start"
                  variant="outline"
                >
                  <ArrowUpRightIcon className="w-4 h-4" />
                  Prompts
                </Button>
              </a>
              <a
                href="https://docs.helicone.ai/features/prompts"
                target="_blank"
              >
                <Button
                  className="items-center gap-2 text-landing-secondary self-start"
                  variant="outline"
                >
                  <ArrowUpRightIcon className="w-4 h-4" />
                  Experiments
                </Button>
              </a>
            </div>
          </div>
          <ExperimentTable />
          {/* <img src="/static/home/experiment.png" alt="Experiment" />   */}
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-5 w-full">
          {evals.map((evaluation) => (
            <div
              key={evaluation.name}
              className="bg-[#f8fafc] p-3 flex flex-col gap-1 w-full max-w-[170px] rounded-lg border border-slate-200 shadow-sm"
            >
              <div className="bg-[#e0f2fe] py-1 px-2 rounded-full border border-[#c3e4fa] self-start">
                <p className="text-[#0ea5e9] text-[11px] font-medium">
                  {evaluation.category}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-medium text-xs text-slate-500">
                  {evaluation.name}
                </p>
                <p className="text-[#0DA5E9] font-semibold text-sm">
                  {evaluation.value}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Experiment;
