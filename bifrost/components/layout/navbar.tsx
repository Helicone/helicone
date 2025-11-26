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
  noMargin?: boolean;
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
            <div className="w-[1.25rem] h-[.2rem] bg-foreground rounded-full"></div>
            <div className="w-[1.25rem] h-[.2rem] bg-foreground rounded-full"></div>
            <div className="w-[.7rem] h-[.2rem] bg-foreground rounded-full"></div>
          </>
        ) : (
          <X className="w-5 h-5 text-foreground stroke-[1.5px] fill-none" />
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
          className="flex items-center justify-between group my-0.5 text-accent-foreground"
        >
          <div className="flex items-center gap-3">
            <span className="navbar-icon-size flex items-center justify-center ml-1">
              {link.icon}
            </span>
            <span className="font-medium text-sm">{link.title}</span>
          </div>
          {isExternalLink ? (
            <ExternalLink className="size-4 text-slate-400 navbar-icon-style" />
          ) : (
            <ChevronRight className="size-4 text-slate-400 navbar-icon-style" />
          )}
        </Link>
      );
    });
  };

  return (
    <nav className="lg:hidden" aria-label="Global">
      <div className="fixed inset-x-0 top-0 z-50 bg-background">
        <MobileHeader
          menuDispatch={[menuOpen, setMenuOpen]}
          className="pl-2 pr-4"
        />
      </div>
      {menuOpen && (
        <div className="fixed inset-0 top-[57px] z-50 bg-background">
          <div className="h-full pb-10 overflow-y-auto">
            <div className="flex flex-col gap-4 pt-3 px-4">
              {/* Login and Contact Buttons */}
              <div className="flex flex-col w-full items-center gap-4 pb-4">
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

              <p className="text-[10px] uppercase text-slate-400 font-medium mx-1">
                Resources
              </p>
              {renderLinks(resourcesComponents)}

              <Separator />

              <p className="text-[10px] uppercase text-slate-400 font-medium  mx-1">
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
    icon: <Gem className="size-5 navbar-icon-style" />,
  },
  {
    title: "Changelog",
    link: {
      href: "/changelog",
      isExternal: false,
    },
    description: "Latest updates and improvements",
    icon: <GitMerge className="size-5 navbar-icon-style" />,
  },
  {
    title: "Blog",
    link: {
      href: "/blog",
      isExternal: false,
    },
    description: "Insights on AI development and best practices",
    icon: <Newspaper className="size-5 navbar-icon-style" />,
  },
];

const toolsComponents: LinkItem[] = [
  {
    title: "Model Comparison",
    link: {
      href: "/comparison",
      isExternal: false,
    },
    description: "Compare LLM models and providers",
    icon: <Scale className="size-5 navbar-icon-style" />,
  },
  {
    title: "Provider Status",
    link: {
      href: "/status",
      isExternal: false,
    },
    description: "Check LLM provider service status",
    icon: <TrendingUp className="size-5 navbar-icon-style" />,
  },
  {
    title: "LLM API Pricing Calculator",
    link: {
      href: "/llm-cost",
      isExternal: false,
    },
    description: "Calculate and compare API costs",
    icon: <HandCoins className="size-5 navbar-icon-style" />,
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
    icon: <BookHeart className="size-5 navbar-icon-style" />,
  },
  {
    title: "Pricing",
    link: {
      href: "/pricing",
      isExternal: false,
    },
    description: "Simple, transparent pricing",
    icon: <HandCoins className="size-5 navbar-icon-style" />,
  },
  {
    title: "Models",
    link: {
      href: "/models",
      isExternal: false,
    },
    description: "Browse and compare AI models",
    icon: <Scale className="size-5 navbar-icon-style" />,
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
    icon: <Mail className="size-5 navbar-icon-style" />,
  },
  {
    title: "Careers",
    link: {
      href: "https://app.dover.com/jobs/helicone",
      isExternal: true,
    },
    description: "Join our team",
    icon: <Briefcase className="size-5 navbar-icon-style" />,
  },
  {
    title: "GitHub",
    link: {
      href: "https://github.com/helicone/helicone",
      isExternal: true,
    },
    description: "Contribute to our project",
    icon: <Github className="size-5 navbar-icon-style" />,
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
      className={`bg-background top-0 sticky z-30 border-b border-border ${props.noMargin ? "" : "mb-10"}`}
    >
      <MobileNav />

      <nav
        className="gap-x-3 mx-auto lg:flex sm:px-16 lg:px-24 2xl:px-40 max-w-[2000px] items-center py-2 hidden justify-between"
        aria-label="Global"
      >
        {/* Logo */}
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

        {/* Nav Links */}
        <div className="w-full mt-4 lg:mt-0 flex gap-x-1 items-center text-sm col-span-8 lg:col-span-6 order-3 lg:order-2 justify-between">
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

              {/* Models */}
              <NavigationMenuItem>
                <Link href="/models" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Models
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
                          className="flex h-full w-full select-none flex-col justify-between rounded-md bg-gradient-to-b from-sky-50 to-muted/70 p-6 no-underline outline-none focus:shadow-md hover:bg-sky-100"
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
                            <p className="text-sm leading-5 text-muted-foreground line-clamp-3">
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
                  className="w-5 h-5 text-accent-foreground"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-accent-foreground">
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
                className="text-sm text-secondary-foreground rounded-lg"
              >
                Contact us
              </Button>
            </Link>
            <Link href="https://us.helicone.ai/signin">
              <Button className="text-sm text-primary-foreground rounded-lg bg-brand">
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
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="flex gap-3">
            <span className="navbar-icon-size">{icon}</span>
            <div className="flex flex-col items-start text-sm font-medium leading-none gap-1">
              {title}
              <p className="text-sm font-light leading-snug text-muted-foreground">
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
