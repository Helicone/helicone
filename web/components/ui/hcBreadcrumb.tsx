import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

interface HcBreadcrumbProps {
  pages: { name: string; href: string }[];
  "data-onboarding-step"?: number;
}

export default function HcBreadcrumb(props: HcBreadcrumbProps) {
  const { pages, "data-onboarding-step": onboardingStep } = props;
  // rerender if pages changes

  return (
    <nav
      className="flex"
      aria-label="Breadcrumb"
      data-onboarding-step={onboardingStep}
    >
      <ol role="list" className="flex items-center space-x-2">
        {pages.map((page, index) => (
          <li key={page.name}>
            <div className="flex items-center space-x-1">
              <Link
                href={page.href}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 hover:underline"
              >
                {page.name}
              </Link>
              {index === pages.length - 1 ? null : (
                <ChevronRightIcon
                  className="h-4 w-4 flex-shrink-0 text-slate-400"
                  aria-hidden="true"
                />
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
