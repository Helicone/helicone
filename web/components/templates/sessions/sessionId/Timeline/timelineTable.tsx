"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineItem, TimelineSection } from "../lib/types";

interface TimelineTableProps {
  sections: TimelineSection[];
  items: TimelineItem[];
  hoveredSection: string | null;
  hoveredItem: TimelineItem | null;
  onHoverItem: (item: TimelineItem | null) => void;
  onHoverSection: (sectionId: string | null) => void;
}

export default function TimelineTable({
  sections,
  items,
  hoveredSection,
  hoveredItem,
  onHoverItem,
  onHoverSection,
}: TimelineTableProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(sections.reduce((acc, section) => ({ ...acc, [section.id]: true }), {}));

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-600">
              Response
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">
              Status
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">
              Created At
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">
              Model
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">
              Cost
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">
              Latency
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">
              Feedback
            </th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <SectionRows
              key={section.id}
              section={section}
              items={items.filter((item) => item.section === section.id)}
              isExpanded={expandedSections[section.id]}
              toggleExpanded={() => toggleSection(section.id)}
              isHovered={hoveredSection === section.id}
              hoveredItemId={hoveredItem?.id}
              onHoverItem={onHoverItem}
              onHoverSection={onHoverSection}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SectionRowsProps {
  section: TimelineSection;
  items: TimelineItem[];
  isExpanded: boolean;
  toggleExpanded: () => void;
  isHovered: boolean;
  hoveredItemId: string | undefined;
  onHoverItem: (item: TimelineItem | null) => void;
  onHoverSection: (sectionId: string | null) => void;
}

function SectionRows({
  section,
  items,
  isExpanded,
  toggleExpanded,
  isHovered,
  hoveredItemId,
  onHoverItem,
  onHoverSection,
}: SectionRowsProps) {
  return (
    <>
      <tr
        className={cn(
          "border-b border-gray-200 cursor-pointer",
          isHovered && "bg-gray-50"
        )}
        onClick={toggleExpanded}
        onMouseEnter={() => onHoverSection(section.id)}
        onMouseLeave={() => onHoverSection(null)}
      >
        <td className="py-3 px-4 flex items-center gap-2">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="font-medium">{section.label}</span>
        </td>
        <td className="py-3 px-4"></td>
        <td className="py-3 px-4"></td>
        <td className="py-3 px-4"></td>
        <td className="py-3 px-4">${section.cost?.toFixed(5) || "0.00000"}</td>
        <td className="py-3 px-4">{section.latency || "0.000s"}</td>
        <td className="py-3 px-4"></td>
      </tr>

      {isExpanded &&
        items.map((item) => (
          <tr
            key={item.id}
            className={cn(
              "border-b border-gray-200",
              hoveredItemId === item.id && "bg-gray-50"
            )}
            onMouseEnter={() => onHoverItem(item)}
            onMouseLeave={() => onHoverItem(null)}
          >
            <td className="py-3 px-4 pl-10">
              <div className="flex items-center gap-2">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  LLM
                </span>
                <span className="text-gray-600">
                  {item.prompt || "Tell me a longer story about a programmer"}
                </span>
              </div>
            </td>
            <td className="py-3 px-4">
              {item.status === "success" ? (
                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  Success
                </span>
              ) : item.status === "error" ? (
                <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                  {item.errorCode || "400"} Error
                </span>
              ) : null}
            </td>
            <td className="py-3 px-4 text-gray-600">
              {item.createdAt || "December 11 9:50 AM"}
            </td>
            <td className="py-3 px-4 text-gray-600">
              {item.model || "gpt-4-0613"}
            </td>
            <td className="py-3 px-4 text-gray-600">
              ${item.cost?.toFixed(5) || "0.00985"}
            </td>
            <td className="py-3 px-4 text-gray-600">
              {item.latency || "5.773s"}
            </td>
            <td className="py-3 px-4">
              {item.feedback === "positive" ? (
                <ThumbsUp className="text-green-500" size={16} />
              ) : item.feedback === "negative" ? (
                <ThumbsDown className="text-red-500" size={16} />
              ) : null}
            </td>
          </tr>
        ))}
    </>
  );
}
