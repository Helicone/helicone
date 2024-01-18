import Image from "next/image";
import { useRouter } from "next/router";
import BasePageV2 from "../components/layout/basePageV2";
import MetaData from "../components/shared/metaData";

const ErrorPage = () => {
  const router = useRouter();

  return (
    <MetaData title="404">
      <BasePageV2>
        <div className="mx-auto flex max-w-7xl items-center justify-between p-6 md:justify-start md:space-x-10 lg:px-8 h-[80vh]">
          <div className="flex flex-col space-y-4">
            <p className="text-5xl sm:text-6xl">Oops!</p>
            <p className="text-3xl sm:text-4xl font-sans font-light">
              Looks like you&apos;re lost. Don&apos;t worry, click on the home
              button below to get back on track.
            </p>
            <p className="text-xs sm:text-sm font-sans font-light">
              *We promise this was not made by GPT-3. We&apos;re real people.
            </p>
            <div className="pt-8 flex flex-row sm:items-center justify-center sm:justify-start gap-4">
              <button
                onClick={() => router.push("/")}
                className="rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Home
              </button>
              <a
                href="https://discord.gg/zsSTcH2qhG"
                target="_blank"
                className="mt-1.5 sm:mt-0 text-base font-semibold leading-7 text-black hover:text-gray-800"
                rel="noreferrer"
              >
                Join Discord <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
          <div className="w-full flex sm:hidden">
            <Image
              src={"/assets/404page.jpeg"}
              alt={"404ErrorMeme"}
              width={250}
              height={250}
              className="mx-auto"
            />
          </div>
          <div className="w-full hidden sm:flex">
            <Image
              src={"/assets/404page.jpeg"}
              alt={"404ErrorMeme"}
              width={400}
              height={400}
              className="mx-auto"
            />
          </div>
        </div>
      </BasePageV2>
    </MetaData>
  );
};

export default ErrorPage;
