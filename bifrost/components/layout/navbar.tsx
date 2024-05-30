import Link from "next/link";
import Image from "next/image";

interface NavBarProps {}

const NavBar = (props: NavBarProps) => {
  const {} = props;

  return (
    <div className="bg-inherit top-0 sticky z-30 border-b border-gray-200 px-4">
      <nav
        className="mx-auto grid grid-cols-8 max-w-6xl items-center py-3"
        aria-label="Global"
      >
        <div className="flex items-center col-span-7 md:col-span-1 order-1">
          <Link href="/" className="-m-1.5">
            <span className="sr-only">Helicone</span>
            <Image
              src={"/static/logo.svg"}
              alt={""}
              height={150}
              width={150}
              priority={true}
            />
          </Link>
        </div>
        <div className="flex gap-x-1 lg:gap-x-2 items-center text-sm col-span-8 md:col-span-6 order-3 md:order-2 justify-center">
          {/* <Link
            href="/about"
            className="flex flex-row items-center font-medium hover:text-black rounded-md px-3 py-1.5 focus:outline-none text-gray-700"
          >
            About
          </Link> */}
          <Link
            href="https://docs.helicone.ai/"
            className="flex flex-row items-center font-medium hover:text-black rounded-md px-3 py-1.5 focus:outline-none text-gray-700"
          >
            Documentation
          </Link>
          <Link
            href="/pricing"
            className="flex flex-row items-center font-medium hover:text-black rounded-md px-3 py-1.5 focus:outline-none text-gray-700"
          >
            Pricing
          </Link>
          <Link
            href="/blog"
            rel="noopener noreferrer"
            className="flex flex-row items-center font-medium hover:text-black rounded-md px-3 py-1.5 focus:outline-none text-gray-700"
          >
            Blog
          </Link>
          <Link
            href="/contact"
            className="flex flex-row items-center font-medium hover:text-black rounded-md px-3 py-1.5 focus:outline-none text-gray-700"
          >
            Contact
          </Link>
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
