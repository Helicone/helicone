import Footer from "../../layout/footer";
import NavBarV2 from "../../layout/navbar/navBarV2";
import Image from "next/image";
import { clsx } from "../clsx";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface InvalidPageProps {}

const InvalidPage = (props: InvalidPageProps) => {
  const {} = props;

  return (
    <>
      <NavBarV2 />
      <div className="flex flex-col items-center justify-center h-[85vh] bg-gray-50">
        <div className="w-full grid grid-cols-8 max-w-5xl mx-auto h-full pt-36 justify-between gap-8 sm:gap-16 text-left">
          <div className="w-fit h-fit mt-16 sm:mt-8 grid grid-cols-3 gap-8 relative col-span-8 sm:col-span-4">
            {[
              "/assets/home/logos/logo.svg",
              "/assets/home/logos/qawolf.png",
              "/assets/home/logos/upenn.png",
              "/assets/home/logos/carta.png",
              "/assets/home/logos/lex.svg",
              "/assets/home/logos/particl.png",
              "/assets/home/logos/mintlify.svg",
              "/assets/home/logos/onboard.png",
              "/assets/home/logos/autogpt.png",
            ].map((item, i) => (
              <div
                key={i}
                className={clsx(
                  i === 1 && "rotate-12 translate-x-8 -translate-y-8",
                  i === 2 && "translate-x-16 -translate-y-20",
                  i === 5 && "-rotate-12 translate-x-8 -translate-y-8",
                  `h-20 w-20 sm:h-28 sm:w-28 border-4 border-black rounded-md shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
                )}
              >
                <Image src={item} alt={""} width={80} height={80} />
              </div>
            ))}
          </div>
          <div className="w-full flex flex-col col-span-8 sm:col-span-4 h-full pt-16">
            <h1 className="text-4xl font-semibold">404 Error</h1>
            <p className="text-lg mt-4 text-gray-500">
              The page you are looking for does not exist. What does it mean to
              exist anyway? Is it the physical presence of a page? Or is it the
              idea of a page? Who knows? But what we do know is that this page
              does not exist - please click the button below to go home.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <Link
                href="/"
                className="flex items-center bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-md pl-3 pr-2 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Go Home <ChevronRightIcon className="w-4 h-4 inline" />
              </Link>
              <Link
                href="https://theuselessweb.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sm flex items-center"
              >
                The Useless Web <ChevronRightIcon className="w-5 h-5 inline" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default InvalidPage;
