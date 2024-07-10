"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface NavBarProps {}

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
      <div className="flex items-center col-span-7 md:col-span-1 order-1">
        <Link href="/" className="-m-1.5">
          <span className="sr-only">Helicone</span>
          <Image
            src={"/static/logo.svg"}
            alt={"Helicone - Open-source LLM observability and monitoring platform for developers"}
            height={150}
            width={150}
            priority={true}
            className="w-auto h-auto md:block hidden"
          />
          <Image
            src={"/static/logo.svg"}
            alt={"Helicone - Open-source LLM observability and monitoring platform for developers"}
            height={150}
            width={150}
            priority={true}
            className="block md:hidden"
          />
        </Link>
      </div>
      <button
        className="transform scale-[90 %] flex flex-col gap-1 items-end justify-end gap-x-2 col-span-1 order-2 md:order-3"
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
  const links = [
    {
      href: "https://docs.helicone.ai/",
      label: "Documentation",
    },
    {
      href: "/pricing",
      label: "Pricing",
    },
    {
      href: "/community",
      label: "Community",
    },
    {
      href: "/blog",
      label: "Blog",
    },
    {
      href: "/contact",
      label: "Contact",
    },
  ];
  return (
    <>
      {links.map((link, i) => (
        <Link
          href={link.href}
          className={
            "flex flex-row items-center font-medium hover:text-black rounded-md px-3 py-1.5 focus:outline-none " +
            " " +
            (path === link.href
              ? "text-black font-bold"
              : "text-gray-600 opacity-75")
          }
          key={`${link}-${i}`}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
};

const MobileNav = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);
  return (
    <nav className="sm:hidden" aria-label="Global">
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
          <NavLinks />
        </div>
      )}
    </nav>
  );
};

const NavBar = (props: NavBarProps) => {
  const {} = props;

  return (
    <div className="bg-inherit top-0 sticky z-30 border-b border-gray-200">
      <MobileNav />
      <nav
        className="mx-auto sm:grid grid-cols-8 max-w-6xl items-center py-3 hidden px-3"
        aria-label="Global"
      >
        <div className="flex items-center col-span-7 md:col-span-1 order-1">
          <Link href="/" className="-m-1.5">
            <span className="sr-only">Helicone</span>
            <Image
              src={"/static/logo.svg"}
              alt={"Helicone - Open-source LLM observability and monitoring platform for developers"}
              height={150}
              width={150}
              priority={true}
              className="w-auto h-auto md:block hidden"
            />
            <Image
              src={"/static/logo.svg"}
              alt={"Helicone - Open-source LLM observability and monitoring platform for developers"}
              height={150}
              width={150}
              priority={true}
              className="block md:hidden"
            />
          </Link>
        </div>
        <div className="mt-4 md:mt-0 flex gap-x-1 lg:gap-x-2 items-center text-sm col-span-8 md:col-span-6 order-3 md:order-2 justify-center">
          <NavLinks />
        </div>
        <div className="flex items-center justify-end gap-x-2 col-span-1 order-2 md:order-3">
          <Link
            href="https://us.helicone.ai/signin"
            className="bg-sky-500 hover:bg-sky-600 border-2 border-sky-700 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Sign In
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
