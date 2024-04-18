import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

interface HcBreadcrumbProps {
  pages: { name: string; href: string }[];
}

export default function HcBreadcrumb(props: HcBreadcrumbProps) {
  const { pages } = props;
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-2">
        {pages.map((page, index) => (
          <li key={page.name}>
            <div className="flex items-center space-x-1">
              <Link
                href={page.href}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 hover:underline"
              >
                {page.name}
              </Link>
              {index === pages.length - 1 ? null : (
                <ChevronRightIcon
                  className="h-4 w-4 flex-shrink-0 text-gray-400"
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
