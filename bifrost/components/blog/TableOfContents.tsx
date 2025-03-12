"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { H2 } from "@/components/ui/typography";

interface Heading {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    className?: string;
    title?: string;
    excludeHeadings?: string[];
    excludePatterns?: RegExp[];
    excludeFaqSections?: boolean;
    maxLevel?: number;
}

export function TableOfContents({
    className,
    title = "Table of Contents",
    excludeHeadings = ["Join Helicone", "Table of Contents"],
    excludePatterns = [],
    excludeFaqSections = true,
    maxLevel = 3
}: TableOfContentsProps) {
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeId, setActiveId] = useState<string>("");

    // Common headings to exclude by default if excludeFaqSections is true
    const faqRelatedHeadings = ["Questions or feedback?", "You might find these useful:"];

    // Combine explicit exclusions with FAQ-related ones if excludeFaqSections is true
    const effectiveExcludeHeadings = excludeFaqSections
        ? [...excludeHeadings, ...faqRelatedHeadings]
        : excludeHeadings;

    useEffect(() => {
        // Find all heading elements in the blog content
        const headingElements = Array.from(
            document.querySelectorAll("h2, h3, h4, h5, h6")
        );

        // Extract heading information
        const headingData = headingElements.map((element) => {
            // Get the heading level from the tag name (h2 = 2, h3 = 3, etc.)
            const level = parseInt(element.tagName.charAt(1));

            // Get or create an ID for the heading
            let id = element.id;
            if (!id) {
                id = element.textContent?.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "") || "";
                element.id = id;
            }

            return {
                id,
                text: element.textContent || "",
                level,
            };
        });

        // Process headings to identify FAQ sections and questions
        const processedHeadings: Heading[] = [];
        let inFaqSection = false;

        headingData.forEach(heading => {
            // Skip headings beyond the max level
            if (heading.level > maxLevel) {
                return;
            }

            // Check if this is a FAQ section heading
            const isFaqHeading =
                heading.text.toLowerCase().includes("faq") ||
                heading.text.toLowerCase().includes("frequently asked") ||
                heading.text.toLowerCase().includes("questions");

            // If this is a FAQ section heading, mark that we're entering a FAQ section
            if (isFaqHeading && heading.level === 2) {
                inFaqSection = true;
                // Include the FAQ section heading itself
                if (!effectiveExcludeHeadings.includes(heading.text)) {
                    processedHeadings.push(heading);
                }
            }
            // If this is a new level 2 heading and not a FAQ heading, we're exiting the FAQ section
            else if (heading.level === 2 && !isFaqHeading) {
                inFaqSection = false;
                // Include non-FAQ headings that aren't explicitly excluded
                if (!effectiveExcludeHeadings.includes(heading.text)) {
                    processedHeadings.push(heading);
                }
            }
            // For all other headings, only include them if they're not in a FAQ section
            else if (!inFaqSection) {
                // Check if heading matches any exclude patterns
                const matchesPattern = excludePatterns.some(pattern =>
                    pattern.test(heading.text)
                );

                // Only add headings that aren't explicitly excluded and don't match any exclude patterns
                if (!effectiveExcludeHeadings.includes(heading.text) && !matchesPattern) {
                    processedHeadings.push(heading);
                }
            }
        });

        setHeadings(processedHeadings);

        // Set up intersection observer to highlight active heading
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: "-100px 0px -80% 0px" }
        );

        // Observe all heading elements that are included in our processed headings
        headingElements.forEach((element) => {
            const text = element.textContent || "";

            // Only observe headings that are in our processed list
            if (processedHeadings.some(h => h.text === text)) {
                observer.observe(element);
            }
        });

        return () => {
            headingElements.forEach((element) => {
                observer.unobserve(element);
            });
        };
    }, [excludeHeadings, excludePatterns, excludeFaqSections, maxLevel, effectiveExcludeHeadings]);

    if (headings.length === 0) {
        return null;
    }

    return (
        <section className={cn("w-full max-w-4xl mx-auto", className)}>
            <H2 className="text-2xl font-semibold mb-6">{title}</H2>

            <nav>
                <ul className="flex flex-col gap-1 pl-0 m-0">
                    {headings.map((heading, index) => (
                        <li
                            key={heading.id}
                            className={cn(
                                "transition-colors flex items-start pl-2",
                                heading.level === 2 ? "ml-0" : "",
                                heading.level === 3 ? "ml-8" : "",
                                heading.level === 4 ? "ml-16" : ""
                            )}
                        >
                            <span className="h-1.5 w-1.5 min-w-1.5 mr-3 bg-slate-300 dark:bg-slate-600 block rounded-full mt-2.5"></span>
                            <Link
                                href={`#${heading.id}`}
                                className={cn(
                                    "hover:text-primary transition-colors font-normal",
                                    activeId === heading.id
                                        ? "text-primary"
                                        : ""
                                )}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const element = document.getElementById(heading.id);
                                    if (element) {
                                        // Get the element's position
                                        // Use different offsets for mobile and desktop
                                        const isMobile = window.innerWidth < 768;
                                        const yOffset = isMobile ? -160 : -80; // Larger offset for mobile to account for headers/navigation
                                        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

                                        // Scroll to the element
                                        window.scrollTo({
                                            top: y,
                                            behavior: 'smooth'
                                        });
                                    }
                                }}
                            >
                                {heading.text}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </section>
    );
} 