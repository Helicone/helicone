"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {
  X,
  Briefcase,
  Mail,
  BookHeart,
  ChevronRight,
  Scale,
  Newspaper,
  Earth,
  ExternalLink,
  Gem,
  Github,
  GitMerge,
  HandCoins,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { BlogStructureMetaData } from "../templates/blog/getMetaData";
import { Button } from "../ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface NavBarProps {
  stars?: number;
  featuredBlogMetadata: BlogStructureMetaData;
  featuredBlogFolderName?: string;
}

const MobileHeader = (props: {
  menuDispatch: [boolean, (menuOpen: boolean) => void];
  className?: string;
}) => {
  const [menuOpen, setMenuOpen] = props.menuDispatch;

  return (
    <div
      className={
        "grid w-full max-w-6xl grid-cols-8 items-center py-3 " + props.className
      }
    >
      <div className="order-1 col-span-7 flex items-center lg:col-span-1">
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
            className="hidden h-auto w-auto lg:block"
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
        className="order-2 col-span-1 flex scale-[90%] transform flex-col items-end justify-end gap-1 gap-x-2 lg:order-3"
        onClick={() => {
          setMenuOpen(!menuOpen);
        }}
      >
        {!menuOpen ? (
          <>
            <div className="bg-foreground h-[.2rem] w-[1.25rem] rounded-full"></div>
            <div className="bg-foreground h-[.2rem] w-[1.25rem] rounded-full"></div>
            <div className="bg-foreground h-[.2rem] w-[.7rem] rounded-full"></div>
          </>
        ) : (
          <X className="text-foreground h-5 w-5 fill-none stroke-[1.5px]" />
        )}
      </button>
    </div>
  );
};

type LinkItem = {
  title: string;
  link: {
    href: string;
    isExternal: boolean;
  };
  description: string;
  icon: React.ReactNode;
};

const MobileNav = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  // Helper function to render links in mobile nav
  const renderLinks = (links: LinkItem[]) => {
    return links.map((link: LinkItem, i: number) => {
      const isExternalLink = link.link.isExternal;
      return (
        <Link
          key={i}
          href={link.link.href}
          target={isExternalLink ? "_blank" : undefined}
          rel={isExternalLink ? "noopener noreferrer" : undefined}
          className="text-accent-foreground group my-0.5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="navbar-icon-size ml-1 flex items-center justify-center">
              {link.icon}
            </span>
            <span className="text-sm font-medium">{link.title}</span>
          </div>
          {isExternalLink ? (
            <ExternalLink className="navbar-icon-style size-4 text-slate-400" />
          ) : (
            <ChevronRight className="navbar-icon-style size-4 text-slate-400" />
          )}
        </Link>
      );
    });
  };

  return (
    <nav className="lg:hidden" aria-label="Global">
      <div className="bg-background fixed inset-x-0 top-0 z-50">
        <MobileHeader
          menuDispatch={[menuOpen, setMenuOpen]}
          className="pl-2 pr-4"
        />
      </div>
      {menuOpen && (
        <div className="bg-background fixed inset-0 top-[57px] z-50">
          <div className="h-full overflow-y-auto pb-10">
            <div className="flex flex-col gap-4 px-4 pt-3">
              {/* Login and Contact Buttons */}
              <div className="flex w-full flex-col items-center gap-4 pb-4">
                <Link href="/signup" className="w-full">
                  <Button variant="default" className="bg-brand w-full">
                    Sign up
                  </Button>
                </Link>
                <Link href="/signin" className="w-full">
                  <Button variant="secondary" className="w-full">
                    Log In
                  </Button>
                </Link>
              </div>

              {renderLinks(mainComponents)}

              <Separator />

              <p className="mx-1 text-[10px] font-medium uppercase text-slate-400">
                Resources
              </p>
              {renderLinks(resourcesComponents)}

              <Separator />

              <p className="mx-1 text-[10px] font-medium uppercase text-slate-400">
                Tools
              </p>
              {renderLinks(toolsComponents)}

              <Separator />

              <div className="flex flex-col gap-4">
                {renderLinks(additionalComponents)}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const resourcesComponents: LinkItem[] = [
  {
    title: "Customer Stories",
    link: {
      href: "/customers",
      isExternal: false,
    },
    description: "Built for scale, security, and control",
    icon: <Gem className="navbar-icon-style size-5" />,
  },
  {
    title: "Changelog",
    link: {
      href: "/changelog",
      isExternal: false,
    },
    description: "Latest updates and improvements",
    icon: <GitMerge className="navbar-icon-style size-5" />,
  },
  {
    title: "Blog",
    link: {
      href: "/blog",
      isExternal: false,
    },
    description: "Insights on AI development and best practices",
    icon: <Newspaper className="navbar-icon-style size-5" />,
  },
];

const toolsComponents: LinkItem[] = [
  {
    title: "Open Stats",
    link: {
      href: "/open-stats",
      isExternal: false,
    },
    description: "Real-time LLM usage analytics",
    icon: <Earth className="navbar-icon-style size-5" />,
  },
  {
    title: "Model Comparison",
    link: {
      href: "/comparison",
      isExternal: false,
    },
    description: "Compare LLM models and providers",
    icon: <Scale className="navbar-icon-style size-5" />,
  },
  {
    title: "Provider Status",
    link: {
      href: "/status",
      isExternal: false,
    },
    description: "Check LLM provider service status",
    icon: <TrendingUp className="navbar-icon-style size-5" />,
  },
  {
    title: "LLM API Pricing Calculator",
    link: {
      href: "/llm-cost",
      isExternal: false,
    },
    description: "Calculate and compare API costs",
    icon: <HandCoins className="navbar-icon-style size-5" />,
  },
];

const mainComponents: LinkItem[] = [
  {
    title: "Docs",
    link: {
      href: "https://docs.helicone.ai/",
      isExternal: true,
    },
    description: "Integrate Helicone into your AI application",
    icon: <BookHeart className="navbar-icon-style size-5" />,
  },
  {
    title: "Pricing",
    link: {
      href: "/pricing",
      isExternal: false,
    },
    description: "Simple, transparent pricing",
    icon: <HandCoins className="navbar-icon-style size-5" />,
  },
];

const additionalComponents: LinkItem[] = [
  {
    title: "Contact",
    link: {
      href: "/contact",
      isExternal: false,
    },
    description: "Get in touch with us",
    icon: <Mail className="navbar-icon-style size-5" />,
  },
  {
    title: "Careers",
    link: {
      href: "https://app.dover.com/jobs/helicone",
      isExternal: true,
    },
    description: "Join our team",
    icon: <Briefcase className="navbar-icon-style size-5" />,
  },
  {
    title: "GitHub",
    link: {
      href: "https://github.com/helicone/helicone",
      isExternal: true,
    },
    description: "Contribute to our project",
    icon: <Github className="navbar-icon-style size-5" />,
  },
];

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
      className="bg-background border-border sticky top-0 z-30 mb-10 border-b"
    >
      <MobileNav />

      <nav
        className="mx-auto hidden max-w-[2000px] items-center justify-between gap-x-3 py-2 sm:px-16 lg:flex lg:px-24 2xl:px-40"
        aria-label="Global"
      >
        {/* Logo */}
        <div className="order-1 flex items-center lg:col-span-1">
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
              className="hidden h-auto w-auto lg:block"
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

        {/* Nav Links */}
        <div className="order-3 col-span-8 mt-4 flex w-full items-center justify-between gap-x-1 text-sm lg:order-2 lg:col-span-6 lg:mt-0">
          <NavigationMenu>
            <NavigationMenuList>
              {/* Docs */}
              <NavigationMenuItem>
                <Link href="https://docs.helicone.ai" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Docs
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* Pricing */}
              <NavigationMenuItem>
                <Link href="/pricing" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* Resources */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-2 p-3 md:w-[500px] lg:w-[600px] lg:grid-cols-[.75fr_1fr]">
                    <li>
                      {resourcesComponents.map((component) => (
                        <ListItem
                          key={component.title}
                          title={component.title}
                          href={component.link.href}
                          icon={component.icon}
                        >
                          {component.description}
                        </ListItem>
                      ))}
                    </li>
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="to-muted/70 flex h-full w-full select-none flex-col justify-between rounded-md bg-gradient-to-b from-sky-50 p-6 no-underline outline-none hover:bg-sky-100 focus:shadow-md"
                          href={
                            props.featuredBlogFolderName
                              ? `/blog/${props.featuredBlogFolderName}`
                              : "/blog"
                          }
                        >
                          <Badge
                            variant="default"
                            className="w-fit self-start whitespace-nowrap"
                          >
                            Latest
                          </Badge>
                          <div className="">
                            {/* pull the latest blog */}
                            <div className="mb-2 mt-4 line-clamp-2 text-lg font-medium">
                              {props.featuredBlogMetadata.title}
                            </div>
                            <p className="text-muted-foreground line-clamp-3 text-sm leading-5">
                              {props.featuredBlogMetadata.description}
                            </p>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Tools */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[380px] gap-2 p-3">
                    {toolsComponents.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.link.href}
                        icon={component.icon}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Careers */}
              <NavigationMenuItem>
                <Link
                  href="https://app.dover.com/jobs/helicone"
                  legacyBehavior
                  passHref
                >
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Careers
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Old Nav Links */}
          {/* <NavLinks /> */}

          {/* Github, contact, login */}
          <div className="flex items-center gap-x-3">
            <a
              href="https://github.com/helicone/helicone"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="ghost" className="gap-x-2 rounded-lg">
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="text-accent-foreground h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-accent-foreground text-sm">
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
                className="text-secondary-foreground rounded-lg text-sm"
              >
                Contact us
              </Button>
            </Link>
            <Link href="https://us.helicone.ai/signin">
              <Button className="text-primary-foreground bg-brand rounded-lg text-sm">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

// Shadcn UI ListItem for Navigation Menu for Web
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { icon?: React.ReactNode }
>(({ className, title, children, icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
            className
          )}
          {...props}
        >
          <div className="flex gap-3">
            <span className="navbar-icon-size">{icon}</span>
            <div className="flex flex-col items-start gap-1 text-sm font-medium leading-none">
              {title}
              <p className="text-muted-foreground text-sm font-light leading-snug">
                {children}
              </p>
            </div>
          </div>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export default NavBar;
