import Image from "next/image";
import Link from "next/link";
import LoginButton from "../shared/auth/loginButton";

interface NavBarProps {}

const NavBar = (props: NavBarProps) => {
  const {} = props;

  return (
    <div className="bg-gray-50 sticky top-0 z-50 shadow-sm">
      <div
        className={
          "border-dashed flex flex-row px-8 py-4 mx-auto max-w-7xl justify-between"
        }
      >
        <div className="flex flex-row gap-12 items-center">
          <Link href="/">
            <Image
              className="rounded-xl"
              alt="Helicone-logo"
              src="/assets/landing/helicone.webp"
              width={150}
              height={150 / (1876 / 528)}
            />
          </Link>

          <Link
            href="https://helicone.ai/pricing"
            className="text-md font-semibold text-gray-900"
          >
            Pricing
          </Link>
          <Link
            href="https://docs.helicone.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-md font-semibold text-gray-900"
          >
            Documentation
          </Link>
          <Link href="/roadmap" className="text-md font-semibold text-gray-900">
            Roadmap
          </Link>
          <Link
            href="https://github.com/Helicone/helicone"
            target="_blank"
            rel="noopener noreferrer"
            className="text-md font-semibold text-gray-900"
          >
            Github
          </Link>
        </div>
        <LoginButton />
      </div>
    </div>
  );
};

export default NavBar;
