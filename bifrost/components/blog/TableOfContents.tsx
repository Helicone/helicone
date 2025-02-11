"use client";

import { useEffect, useRef, useState } from "react";

export default function TableOfContents({
  headings,
}: {
  headings: { id: string; text: string; level: number }[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const skipObserver = useRef(false);
  const tocRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { hash } = window.location;
    if (hash) {
      const id = hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
        setActiveId(id);
      }
    }
  }, []);

  const handleLinkClick = (id: string) => {
    skipObserver.current = true;
    setActiveId(id);
    window.history.replaceState(null, "", `#${id}`);
    setTimeout(() => {
      skipObserver.current = false;
    }, 1000);
  };

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-30% 0% -80% 0px",
    };

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      if (skipObserver.current) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id !== "") {
          const newId = entry.target.id;
          setActiveId(newId);
          window.history.replaceState(null, "", `#${newId}`);
          const activeLink = tocRef.current?.querySelector(`a[href="#${newId}"]`);
          setTimeout(() => {
            if (tocRef.current && activeLink) {
              const containerRect = tocRef.current.getBoundingClientRect();
              const activeRect = activeLink.getBoundingClientRect();
              if (activeRect.top < containerRect.top || activeRect.bottom > containerRect.bottom) {
                activeLink.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
              }
            }
          }, 1000);
        }
      });
    };

    const observer = new IntersectionObserver(handleObserver, observerOptions);
    const headingElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headingElements.forEach((el) => observer.observe(el));

    return () => {
      headingElements.forEach((el) => observer.unobserve(el));
    };
  }, [activeId]);

  return (
    <div className="h-full flex flex-col space-y-2 md:sticky top-16 md:top-32">
      <h3 className="text-sm font-semibold text-gray-500 px-3">
        <span className="text-black">Table of Contents</span>
      </h3>
      <div ref={tocRef} className="max-h-[80vh] overflow-y-auto pr-2">
        <ul className="text-sm text-gray-700 mt-2 space-y-2 px-3">
          {headings.map(({ text, id, level }) => (
            <li key={id} className={`pl-${(level - 1) * 2} w-full`}>
              <a
                href={`#${id}`}
                onClick={() => handleLinkClick(id)}
                className={`block hover:underline ${
                  activeId === id ? "text-sky-500 font-bold" : ""
                }`}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
