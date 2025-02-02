"use client";

import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon, PlusIcon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
} from "@/components/ui/table";
import { useState, useCallback, useEffect, useRef } from "react";

const data: {
  messages: string;
  original: string;
  prompt1: string;
  prompt2: string;
}[] = [
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `This beginner-friendly course guides you through foundational concepts with real-world examples...`,
    prompt1: `Master the fundamentals in this hands-on learning journey, featuring practical exercises...`,
    prompt2: `A practical journey through essential topics, designed to build your confidence...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `An introductory series covering key principles through interactive lessons and projects...`,
    prompt1: `Step-by-step tutorials designed for newcomers, with comprehensive practice materials...`,
    prompt2: `Build your skills with this comprehensive guide, featuring hands-on workshops...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `Learn the basics through interactive sessions and guided practice assignments...`,
    prompt1: `A structured approach to mastering core concepts, with real-world applications...`,
    prompt2: `Dive into core concepts with guided exercises and practical implementations...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `Start your journey with this accessible introduction to fundamental principles...`,
    prompt1: `From novice to practitioner: a carefully structured learning experience...`,
    prompt2: `An engaging introduction that transforms complex topics into digestible lessons...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `A comprehensive beginner's guide featuring step-by-step instruction and exercises...`,
    prompt1: `Progress through carefully crafted lessons designed for optimal learning...`,
    prompt2: `Experience a thoughtfully designed curriculum that builds lasting knowledge...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `Begin your learning journey with this foundational course packed with examples...`,
    prompt1: `A beginner-focused approach that ensures steady progress through key concepts...`,
    prompt2: `Master essential skills through this methodically structured learning path...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `Perfect for newcomers: a gentle introduction to core principles and practices...`,
    prompt1: `Build confidence through structured learning and hands-on practice sessions...`,
    prompt2: `Transform your understanding with this carefully paced learning experience...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `Start strong with this beginner-oriented course featuring practical exercises...`,
    prompt1: `An accessible approach to mastering fundamentals through guided practice...`,
    prompt2: `Develop your skills progressively with this well-structured learning path...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `A foundation-building course designed to make complex concepts approachable...`,
    prompt1: `Learn at your pace with this methodically structured beginner's guide...`,
    prompt2: `A comprehensive introduction focusing on practical skill development...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `Begin your learning adventure with this accessible, example-rich course...`,
    prompt1: `A carefully crafted journey from basic concepts to practical mastery...`,
    prompt2: `Gain confidence through this structured approach to essential skills...`,
  },
  {
    messages: `{"role": "system", "content": "Get...`,
    original: `An entry-level course that breaks down complex topics into manageable steps...`,
    prompt1: `Master the basics through this engaging, practice-oriented curriculum...`,
    prompt2: `A systematic approach to building fundamental knowledge and skills...`,
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
    <div ref={tableRef} className="relative w-full h-[400px] z-[1]">
      <div className="absolute inset-0 h-full w-1/6 pointer-events-none bg-gradient-to-r from-white to-transparent z-[2]"></div>
      <div className="absolute h-[100px] w-full bottom-0 right-0 pointer-events-none bg-gradient-to-t from-white to-transparent z-[2]"></div>
      <div className="w-full h-full border border-slate-200 rounded-2xl overflow-hidden">
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
  return <ExperimentTable />;
};

export default Experiment;
