import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import ContributorsImg from "@/public/static/contributors.png";
import DeployImg from "@/public/static/deploy-cube.png";
import { cn } from "@/lib/utils";
import { ISLAND_WIDTH } from "@/app/page";

export default function OpenSource() {
  return (
    <div
      className={cn(
        ISLAND_WIDTH,
        "flex flex-col md:space-y-4 pb-2 md:items-center items-start md:text-center text-start w-full "
      )}
    >
      <div className="flex flex-col items-start gap-[12px]">
        <h2 className="text-3xl md:text-4xl font-bold text-black text-start tracking-tight leading-tight">
          Proudly <span className="text-sky-500">open source</span>
        </h2>
        <p className="text-sm md:text-md text-gray-500 max-w-4xl">
          We value transparency and we believe in the power of community.
        </p>
      </div>

      <div className="flex flex-col md:flex-row h-min self-center md:pt-12 pt-4 md:gap-8 gap-4 ">
        <div className="flex flex-col items-start  border-2 rounded-2xl pt-6">
          <div className="flex flex-col items-start px-[24px] gap-2 text-left">
            <h3 className="text-lg font-bold">Join our community on Discord</h3>
            <p className="text-sm text-gray-400">
              We appreciate all of Helicone&apos;s contributors. You are welcome
              to join our community on{" "}
              <a
                href="https://discord.com/invite/2TkeWdXNPQ"
                target="_blank"
                className="text-sky-500 font-bold"
              >
                Discord
              </a>{" "}
              and become a contributor.
            </p>

            <a
              href="https://github.com/helicone/helicone"
              target="_blank"
              className="text-gray-500 font-bold border-2 rounded-lg mt-2 p-1 px-2 flex items-center gap-1"
            >
              Fork Helicone
              <ChevronRightIcon className="w-5 h-5" />
            </a>
          </div>

          <Image src={ContributorsImg} alt="Contributors" />
        </div>

        <div className="flex flex-col justify-between border-2 rounded-2xl pt-6">
          <div className="flex flex-col self-start items-start px-6 gap-2 text-left">
            <h3 className="text-lg font-bold">Deploy on-prem</h3>
            <p className="text-sm text-gray-400">
              Cloud-host or deploy on-prem with our production-ready HELM chart
              for maximum security. Contact us for more options.
            </p>

            <Link
              href="/contact"
              className="text-gray-500 font-bold border-2 rounded-lg mt-2 p-1 px-2 flex items-center gap-1 w-fit self-end"
            >
              Get in touch
              <ChevronRightIcon className="w-5 h-5" />
            </Link>
          </div>

          <Image
            className="self-start pl-8 w-9/12"
            src={DeployImg}
            alt="Deploy on prem"
          />
        </div>
      </div>
    </div>
  );
}
