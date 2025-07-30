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
      <div className="flex h-full flex-col items-center justify-center bg-gray-50 px-4 py-16 lg:min-h-[85vh] lg:py-36">
        <div className="mx-auto grid h-full w-full max-w-5xl grid-cols-8 justify-between gap-8 text-left lg:gap-16">
          <div className="relative col-span-8 mt-16 hidden h-fit w-fit grid-cols-3 gap-8 sm:grid lg:col-span-4 lg:mt-8">
            {Array.from(Array(9).keys()).map((item, i) => (
              <div
                key={i}
                className={clsx(
                  i === 1 && "-translate-y-8 translate-x-8 rotate-12",
                  i === 2 && "-translate-y-20 translate-x-16",
                  i === 5 && "-translate-y-8 translate-x-8 -rotate-12",
                  `flex h-20 w-20 items-center justify-center rounded-md border-4 border-black bg-white text-sm font-semibold shadow-lg lg:h-28 lg:w-28`,
                )}
              >
                <Image
                  src={"/assets/random/doge.png"}
                  alt={""}
                  width={80}
                  height={80}
                />
              </div>
            ))}
          </div>
          <div className="col-span-8 flex h-full w-full flex-col pt-16 lg:col-span-4">
            <h1 className="text-4xl font-semibold">404 Error</h1>
            <p className="mt-4 text-lg text-gray-500">
              The page you are looking for does not exist. What does it mean to
              exist anyway? Is it the physical presence of a page? Or is it the
              idea of a page? Who knows? But what we do know is that this page
              does not exist - please click the button below to go home.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center whitespace-nowrap rounded-md bg-gray-900 py-1.5 pl-3 pr-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Go Home <ChevronRightIcon className="inline h-4 w-4" />
              </Link>
              <Link
                href="https://theuselessweb.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm font-semibold"
              >
                The Useless Web <ChevronRightIcon className="inline h-5 w-5" />
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
