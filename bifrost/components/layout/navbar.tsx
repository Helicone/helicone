"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartBarIcon,
  EnvelopeIcon,
  XMarkIcon,
  ChevronDownIcon,
  CalculatorIcon,
  ArrowsPointingOutIcon,
  ClockIcon,
  UserGroupIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ArrowLeftRightIcon, BookIcon, Globe } from "lucide-react";

interface NavBarProps {
  stars?: number;
}

const MobileHeader = (props: {
  menuDispatch: [boolean, (menuOpen: boolean) => void];
  className?: string;
}) => {
  const [menuOpen, setMenuOpen] = props.menuDispatch;
  return (
    <div
      className={
        "w-full grid grid-cols-8 max-w-6xl items-center py-3 " + props.className
      }
    >
      <div className="flex items-center col-span-7 lg:col-span-1 order-1">
        <Link href="/" className="-m-1.5">
          <span className="sr-only">Helicone</span>
          <Image
            src={"/static/logo.svg"}
            alt={
              "Helicone - Open-source LLM observability and monitoring platform for developers"
            }
            height={150}
            width={150}
            priority={true}
            className="w-auto h-auto lg:block hidden"
          />
          <Image
            src={"/static/logo.svg"}
            alt={
              "Helicone - Open-source LLM observability and monitoring platform for developers"
            }
            height={150}
            width={150}
            priority={true}
            className="block lg:hidden"
          />
        </Link>
      </div>
      <button
        className="transform scale-[90 %] flex flex-col gap-1 items-end justify-end gap-x-2 col-span-1 order-2 lg:order-3"
        onClick={() => {
          setMenuOpen(!menuOpen);
        }}
      >
        {!menuOpen ? (
          <>
            <div className="w-[1.25rem] h-[.2rem] bg-slate-800 rounded-full"></div>
            <div className="w-[1.25rem] h-[.2rem] bg-slate-800 rounded-full"></div>
            <div className="w-[.7rem] h-[.2rem] bg-slate-800 rounded-full"></div>
          </>
        ) : (
          <XMarkIcon
            className="w-6 h-6 text-black"
            onClick={() => {
              setMenuOpen(false);
            }}
          />
        )}
      </button>
    </div>
  );
};

const NavLinks = () => {
  const path = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const links = [
    {
      href: "https://docs.helicone.ai/",
      label: "Docs",
    },
    {
      href: "/pricing",
      label: "Pricing",
    },
    {
      type: "dropdown" as const,
      label: "Resources",
      items: [
        {
          href: "/changelog",
          label: "Changelog",
          description: "Latest updates and improvements",
          icon: <ClockIcon className="h-6 w-6 text-sky-500" />,
        },
        {
          href: "/community",
          label: "Community",
          description: "Join our growing developer community",
          icon: <UserGroupIcon className="h-6 w-6 text-sky-500" />,
        },
        {
          href: "/blog",
          label: "Blog",
          description: "Insights on AI development and best practices",
          icon: <BookIcon className="h-6 w-6 text-sky-500" />,
        },
      ],
    },
    {
      type: "dropdown" as const,
      label: "Tools",
      items: [
        {
          href: "/open-stats",
          label: "Open Stats",
          description: "Real-time LLM usage analytics",
          icon: <Globe className="h-6 w-6 text-sky-500" />,
        },
        {
          href: "/comparison",
          label: "Model Comparison",
          description: "Compare different LLM models and providers",
          icon: <ArrowLeftRightIcon className="h-6 w-6 text-sky-500" />,
        },
        {
          href: "/status",
          label: "Provider Status",
          description: "Check LLM provider service status",
          icon: <ChartBarIcon className="h-6 w-6 text-sky-500" />,
        },
        {
          href: "/llm-cost",
          label: "LLM API Pricing Calculator",
          description: "Calculate and compare API costs",
          icon: <CalculatorIcon className="h-6 w-6 text-sky-500" />,
        },
      ],
    },
    {
      href: "https://app.dover.com/jobs/helicone",
      label: "Careers",
    },
  ];
  return (
    <div className="flex gap-x-2 flex-col lg:flex-row">
      {links.map((link, i) => {
        if (link.type === "dropdown") {
          return (
            <DropdownMenu
              key={`${link}-${i}`}
              onOpenChange={(open) => {
                setOpenDropdown(open ? link.label : null);
              }}
            >
              <DropdownMenuTrigger className="flex items-center gap-1 font-regular hover:text-black rounded-md px-3 py-1.5 focus:outline-none text-slate-700 opacity-75">
                {link.label}
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-600 ${
                    openDropdown === link.label ? "rotate-180" : ""
                  }`}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[240px] p-2 space-y-1.5">
                {link.items?.map((item, j) => (
                  <DropdownMenuItem key={j} asChild>
                    <Link
                      href={item.href}
                      className="w-full cursor-pointer flex items-start gap-2 p-3 text-slate-700 hover:text-black"
                    >
                      <div className="mt-1 flex-shrink-0 p-2.5 rounded-md border border-sky-100 bg-sky-50">
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-sm text-slate-500 font-normal">
                          {item.description}
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        return (
          <Link
            href={link.href}
            className={
              "flex flex-row items-center font-regular hover:text-black rounded-md px-3 py-1.5 focus:outline-none " +
              " " +
              (path === link.href
                ? "text-slate-700 font-medium"
                : "text-slate-700 opacity-75")
            }
            key={`${link}-${i}`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
};

const NavIcons = () => {
  const path = usePathname();
  const links = [
    {
      href: "/contact",
      label: "Contact",
      icon: <EnvelopeIcon className="w-5 h-5" />,
    },
    {
      href: "https://github.com/Helicone",
      label: "GitHub",
      icon: (
        <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ];
  return (
    <div className="flex flex-row gap-x-3">
      {links.map((link, i) => (
        <Link
          href={link.href}
          className={
            "flex flex-row items-center font-medium hover:text-black rounded-md py-1.5 focus:outline-none " +
            " " +
            (path === link.href
              ? "text-black font-bold"
              : "text-gray-600 opacity-75")
          }
          key={`${link}-${i}`}
        >
          {link.icon}
        </Link>
      ))}
    </div>
  );
};

const MobileNav = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  const mobileLinks: Array<{
    href?: string;
    label: string;
    icon?: React.ReactNode;
    type?: "section";
    items?: Array<{
      href: string;
      label: string;
      icon: React.ReactNode;
      description?: string;
    }>;
  }> = [
    {
      href: "https://docs.helicone.ai/",
      label: "Docs",
    },
    {
      href: "/pricing",
      label: "Pricing",
    },
    {
      type: "section",
      label: "Tools",
      items: [
        {
          href: "/open-stats",
          label: "Open Stats",
          icon: <Globe className="h-4 w-4 text-sky-500" />,
        },
        {
          href: "/comparison",
          label: "Model Comparison",
          icon: <ArrowLeftRightIcon className="h-4 w-4 text-sky-500" />,
        },
        {
          href: "/status",
          label: "Provider Status",
          icon: <ChartBarIcon className="h-4 w-4 text-sky-500" />,
        },
        {
          href: "/llm-cost",
          label: "LLM API Pricing Calculator",
          icon: <CalculatorIcon className="h-4 w-4 text-sky-500" />,
        },
      ],
    },
    {
      type: "section",
      label: "Resources",
      items: [
        {
          href: "/changelog",
          label: "Changelog",
          icon: <ClockIcon className="h-4 w-4 text-sky-500" />,
        },
        {
          href: "/community",
          label: "Community",
          icon: <UserGroupIcon className="h-4 w-4 text-sky-500" />,
        },
        {
          href: "/blog",
          label: "Blog",
          icon: <NewspaperIcon className="h-4 w-4 text-sky-500" />,
        },
      ],
    },
  ];

  return (
    <nav className="lg:hidden" aria-label="Global">
      <MobileHeader menuDispatch={[menuOpen, setMenuOpen]} className="px-10" />
      {menuOpen && (
        <div className="absolute top-0 right-0 bottom-0 left-0 z-10 h-screen w-full flex flex-col px-10 bg-white gap-5 ">
          <MobileHeader menuDispatch={[menuOpen, setMenuOpen]} />
          <div className="flex flex-col gap-3 w-full mt-2">
            <Link
              href="https://us.helicone.ai/signin"
              className="text-center py-3 bg-slate-100 whitespace-nowrap rounded-md px-4 text-sm font-semibold text-black shadow-sm"
            >
              Sign in
            </Link>
            <Link
              href="https://us.helicone.ai/signup"
              className="text-center py-3 bg-sky-500 hover:bg-sky-600 border-2 whitespace-nowrap rounded-md px-4 text-sm font-semibold text-white shadow-sm"
            >
              Sign up for free
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {mobileLinks.map((link, i) => {
              if (link.type === "section") {
                return (
                  <div key={i} className="flex flex-col gap-3">
                    <p className="text-slate-700 font-medium">{link.label}</p>
                    <div className="flex flex-col gap-3 pl-3">
                      {link.items?.map((item, j) => (
                        <Link
                          key={j}
                          href={item.href}
                          className="flex gap-2 group"
                        >
                          <div className="mt-1 flex-shrink-0">{item.icon}</div>
                          <div className="flex flex-col">
                            <span className="text-slate-500 font-normal group-hover:text-black">
                              {item.label}
                            </span>
                            <span className="text-sm text-slate-500">
                              {item.description}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }
              if (!link.href) return null;
              return (
                <Link
                  key={i}
                  href={link.href}
                  className="text-slate-700 font-medium hover:text-black flex items-center gap-2"
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </div>
          <NavIcons />
        </div>
      )}
    </nav>
  );
};

const NavBar = (props: NavBarProps) => {
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      const height = headerRef.current.offsetHeight;
      document.documentElement.style.setProperty(
        "--header-offset",
        `${height}px`
      );
    }
  }, []);

  return (
    <div
      ref={headerRef}
      className="bg-white top-0 sticky z-30 border-b border-gray-200"
    >
      <MobileNav />
      <nav
        className="gap-x-3 mx-auto lg:flex sm:px-16 lg:px-24 2xl:px-40 max-w-[2000px] items-center py-3 hidden justify-between"
        aria-label="Global"
      >
        <div className="flex items-center lg:col-span-1 order-1">
          <Link href="/" className="-m-1.5 w-[154px]">
            <span className="sr-only">Helicone</span>
            <Image
              src={"/static/logo.svg"}
              alt={
                "Helicone - Open-source LLM observability and monitoring platform for developers"
              }
              height={150}
              width={150}
              priority={true}
              className="w-auto h-auto lg:block hidden"
            />
            <Image
              src={"/static/logo.svg"}
              alt={
                "Helicone - Open-source LLM observability and monitoring platform for developers"
              }
              height={150}
              width={150}
              priority={true}
              className="block lg:hidden"
            />
          </Link>
        </div>
        <div className="w-full mt-4 lg:mt-0 flex gap-x-1 items-center text-sm col-span-8 lg:col-span-6 order-3 lg:order-2 justify-between">
          <NavLinks />
          <div className="flex items-center gap-x-3">
            <a
              href="https://github.com/helicone/helicone"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" className="gap-x-2 rounded-lg">
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-[#64748B]">
                  {props.stars
                    ? props.stars.toLocaleString("en-US", {
                        notation: "compact",
                        compactDisplay: "short",
                      })
                    : "0"}
                </p>
              </Button>
            </a>
            <Link href="/contact">
              <Button
                variant="secondary"
                className="text-sm text-landing-description rounded-lg"
              >
                Contact us
              </Button>
            </Link>
            <Link href="https://us.helicone.ai/signin">
              <Button className="text-sm text-white rounded-lg bg-brand">
                Log In
              </Button>
            </Link>
            {/* <NavIcons /> */}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
