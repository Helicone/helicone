import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import ContributorsImg from "@/public/static/contributors.png";
import DeployImg from "@/public/static/deploy-cube.png";
import { cn } from "@/lib/utils";
import { ISLAND_WIDTH } from "@/lib/utils";

export default function OpenSource() {
  return (
    <div
      className={cn(
        ISLAND_WIDTH,
        "flex w-full flex-col items-start pb-2 text-start md:items-center md:space-y-4 md:text-center"
      )}
    >
      <div className="flex flex-col items-start gap-[12px]">
        <h2 className="text-start text-3xl font-bold leading-tight tracking-tight text-black md:text-4xl">
          Proudly <span className="text-sky-500">open source</span>
        </h2>
        <p className="md:text-md max-w-4xl text-sm text-gray-500">
          We value transparency and we believe in the power of community.
        </p>
      </div>

      <div className="flex h-min flex-col gap-4 self-center pt-4 md:flex-row md:gap-8 md:pt-12">
        <div className="flex flex-col items-start rounded-2xl border-2 pt-6">
          <div className="flex flex-col items-start gap-2 px-[24px] text-left">
            <h3 className="text-lg font-bold">Join our community on Discord</h3>
            <p className="text-sm text-gray-400">
              We appreciate all of Helicone&apos;s contributors. You are welcome
              to join our community on{" "}
              <a
                href="https://discord.com/invite/2TkeWdXNPQ"
                target="_blank"
                className="font-bold text-sky-500"
              >
                Discord
              </a>{" "}
              and become a contributor.
            </p>

            <a
              href="https://github.com/helicone/helicone"
              target="_blank"
              className="mt-2 flex items-center gap-1 rounded-lg border-2 p-1 px-2 font-bold text-gray-500"
            >
              Fork Helicone
              <ChevronRightIcon className="h-5 w-5" />
            </a>
          </div>

          <Image src={ContributorsImg} alt="Contributors" />
        </div>

        <div className="flex flex-col justify-between rounded-2xl border-2 pt-6">
          <div className="flex flex-col items-start gap-2 self-start px-6 text-left">
            <h3 className="text-lg font-bold">Deploy on-prem</h3>
            <p className="text-sm text-gray-400">
              Cloud-host or deploy on-prem with our production-ready HELM chart
              for maximum security. Contact us for more options.
            </p>

            <Link
              href="/contact"
              className="mt-2 flex w-fit items-center gap-1 self-end rounded-lg border-2 p-1 px-2 font-bold text-gray-500"
            >
              Get in touch
              <ChevronRightIcon className="h-5 w-5" />
            </Link>
          </div>

          <Image
            className="w-9/12 self-start pl-8"
            src={DeployImg}
            alt="Deploy on prem"
          />
        </div>
      </div>
    </div>
  );
}
