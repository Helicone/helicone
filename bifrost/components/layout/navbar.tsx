"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  EnvelopeIcon,
  XMarkIcon,
  UserGroupIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { BookHeart, ChevronDown, ChevronRight, Component, Earth, Gem, Github, GitMerge, HandCoins, TrendingUp, ExternalLink } from "lucide-react";

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
        className="transform scale-[90%] flex flex-col gap-1 items-end justify-end gap-x-2 col-span-1 order-2 lg:order-3"
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
            className="w-5 h-5 text-slate-700 stroke-[1.5px] fill-none"
            onClick={() => {
              setMenuOpen(false);
            }}
          />
        )}
      </button>
    </div>
  );
};

const MENU_ICON_CLASSES = "h-4 w-4 text-sky-500 stroke-[1.5px] fill-none m-1";

// Create a new component for menu icons
const MenuIcon = ({ children }: { children: React.ReactNode }) => (
  <div className={MENU_ICON_CLASSES}>
    {children}
  </div>
);

const NavLinks = () => {
  const path = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150); // Small delay to make the interaction smoother
  };

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
          icon: <GitMerge className={MENU_ICON_CLASSES} />,
        },
        {
          href: "/blog",
          label: "Blog",
          description: "Insights on AI development and best practices",
          icon: <BookHeart className={MENU_ICON_CLASSES} />,
        },
        {
          href: "/community",
          label: "Community",
          description: "Built for scale, security, and control",
          icon: <Gem className={MENU_ICON_CLASSES} />,
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
          icon: <Earth className={MENU_ICON_CLASSES} />,
        },
        {
          href: "/comparison",
          label: "Model Comparison",
          description: "Compare different LLM models and providers",
          icon: <Component className={MENU_ICON_CLASSES} />,
        },
        {
          href: "/status",
          label: "Provider Status",
          description: "Check LLM provider service status",
          icon: <TrendingUp className={MENU_ICON_CLASSES} />,
        },
        {
          href: "/llm-cost",
          label: "API Pricing Calculator",
          description: "Calculate and compare API costs",
          icon: <HandCoins className={MENU_ICON_CLASSES} />,
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
              key={link.href}
              open={openDropdown === link.label}
            >
              <DropdownMenuTrigger
                className="flex items-center gap-1 font-regular hover:text-black rounded-md px-4 py-2.5 focus:outline-none text-slate-700 opacity-75 cursor-pointer w-full"
                onMouseEnter={() => handleMouseEnter(link.label)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="flex items-center gap-1">
                  {link.label}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${openDropdown === link.label ? "translate-y-0.5" : ""
                      } stroke-[1.5px] fill-none`}
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-[240px]"
                onMouseEnter={() => handleMouseEnter(link.label)}
                onMouseLeave={handleMouseLeave}
              >
                {link.items?.map((item, j) => (
                  <>
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className="w-full cursor-pointer flex items-start gap-2 text-slate-700 hover:text-black py-2 px-3"
                      >
                        <div className="flex-shrink-0 self-start">
                          {item.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-[13px] text-slate-500 font-light">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    {j < link.items.length - 1 && <DropdownMenuSeparator className="hidden lg:block" />}
                  </ >
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
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </div >
  );
};

const NavIcons = () => {
  const path = usePathname();
  const links = [
    {
      href: "/contact",
      label: "Contact",
      icon: <EnvelopeIcon className={MENU_ICON_CLASSES} />,
    },
    {
      href: "https://github.com/Helicone",
      label: "GitHub",
      icon: <Github className={MENU_ICON_CLASSES} />,
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
          key={link.href}
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

  // Define the link type
  type NavLink = {
    href: string;
    label: string;
    icon: React.ReactNode;
  };

  // Group the links into categories
  const standardLinks: NavLink[] = [
    {
      href: "https://docs.helicone.ai/",
      label: "Docs",
      icon: <BookHeart className={MENU_ICON_CLASSES} />,
    },
    {
      href: "/pricing",
      label: "Pricing",
      icon: <HandCoins className={MENU_ICON_CLASSES} />,
    },
  ];

  const resourcesLinks: NavLink[] = [
    {
      href: "/changelog",
      label: "Changelog",
      icon: <GitMerge className={MENU_ICON_CLASSES} />,
    },
    {
      href: "/blog",
      label: "Blog",
      icon: <NewspaperIcon className={MENU_ICON_CLASSES} />,
    },
    {
      href: "/community",
      label: "Community",
      icon: <Gem className={MENU_ICON_CLASSES} />,
    },
  ];

  const toolsLinks: NavLink[] = [
    {
      href: "/open-stats",
      label: "Open Stats",
      icon: <Earth className={MENU_ICON_CLASSES} />,
    },
    {
      href: "/comparison",
      label: "Model Comparison",
      icon: <Component className={MENU_ICON_CLASSES} />,
    },
    {
      href: "/status",
      label: "Provider Status",
      icon: <TrendingUp className={MENU_ICON_CLASSES} />,
    },
    {
      href: "/llm-cost",
      label: "API Pricing Calculator",
      icon: <HandCoins className={MENU_ICON_CLASSES} />,
    },
  ];

  const additionalLinks: NavLink[] = [
    {
      href: "/contact",
      label: "Contact",
      icon: <EnvelopeIcon className={MENU_ICON_CLASSES} />,
    },
    {
      href: "https://app.dover.com/jobs/helicone",
      label: "Careers",
      icon: <UserGroupIcon className={MENU_ICON_CLASSES} />,
    },
    {
      href: "https://github.com/Helicone",
      label: "GitHub",
      icon: <Github className={MENU_ICON_CLASSES} />,
    },
  ];

  // Helper function to render links
  const renderLinks = (links: NavLink[]) => {
    return links.map((link: NavLink, i: number) => {
      const isExternalLink = link.label === "Careers" || link.label === "GitHub";
      return (
        <Link
          key={i}
          href={link.href}
          target={isExternalLink ? "_blank" : undefined}
          rel={isExternalLink ? "noopener noreferrer" : undefined}
          className="flex items-center group gap-1 text-slate-700 hover:text-black"
        >
          <div className="flex-shrink-0">{link.icon}</div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {link.label}
            </span>
          </div>
          {isExternalLink ? (
            <ExternalLink className="h-4 w-4 ml-auto text-slate-400 stroke-[1.5px]" />
          ) : (
            <ChevronRight className="h-4 w-4 ml-auto text-slate-400 stroke-[1.5px]" />
          )}
        </Link>
      );
    });
  };

  return (
    <nav className="lg:hidden" aria-label="Global">
      <div className="fixed inset-x-0 top-0 z-50 bg-white">
        <MobileHeader menuDispatch={[menuOpen, setMenuOpen]} className="pl-2 pr-4" />
      </div>
      {menuOpen && (
        <div className="fixed inset-0 top-[57px] z-50 bg-white">
          <div className="h-full overflow-y-auto">
            <div className="flex flex-col gap-2 pt-3 px-4">
              {/* Standard Links */}
              <div className="flex flex-col gap-4">
                {renderLinks(standardLinks)}
              </div>

              {/* Resources Section */}
              <div className="py-2 border-t border-slate-100">
                <p className="text-[10px] uppercase text-slate-400 font-medium mt-2 mb-4 mx-1">Resources</p>
                <div className="flex flex-col gap-4">
                  {renderLinks(resourcesLinks)}
                </div>
              </div>

              {/* Tools Section */}
              <div className="py-2 border-t border-slate-100">
                <p className="text-[10px] uppercase text-slate-400 font-medium mt-2 mb-4 mx-1">Tools</p>
                <div className="flex flex-col gap-4">
                  {renderLinks(toolsLinks)}
                </div>
              </div>

              {/* Additional Links */}
              <div className="py-4 border-t border-slate-100 mb-10">
                <div className="flex flex-col gap-4">
                  {renderLinks(additionalLinks)}
                </div>
              </div>
            </div>
          </div>
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
      className="bg-white top-0 sticky z-30 border-b border-gray-200 mb-10"
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
            <Link href="/signin">
              <Button
                variant="ghost"
                className="text-sm text-landing-description rounded-lg"
              >
                Log in
              </Button>
            </Link>
            <a
              href="https://github.com/helicone/helicone"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" className="gap-x-2 rounded-lg">
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-landing-description"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-slate-500">
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
            <Link href="https://us.helicone.ai/signup">
              <Button className="text-sm text-white rounded-lg bg-brand">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
