import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

export default function OpenSource() {
  return (
    <div className="flex flex-col md:space-y-4 pb-2 mt-32 w-full md:items-center items-start md:text-center text-start">

      <h2 className="text-3xl md:text-4xl font-bold text-black text-center tracking-tight leading-tight pl-7">
        Proudly{" "}
        <span className="text-sky-500">open source</span>
      </h2>
      <p className="text-sm md:text-md text-gray-500 max-w-4xl text-center pl-7">
        We value transparency and the power of community.
      </p>
      
      <div className="flex flex-col md:flex-row items-center self-center md:pt-12 pt-4 md:gap-16 gap-4 w-min">

        <div className="flex flex-col items-start justify-evenly border-2 rounded-2xl pt-6 min-w-[350px] md:min-w-[500px]">
          <div className="flex flex-col items-start px-6 gap-2">
            <h3 className="text-lg font-bold">Join our community on Discord</h3>
            <p className="text-sm text-gray-400">We appreciate all of Helicone&apos;s contributors. You are welcome to join our community on <a href="https://discord.com/invite/2TkeWdXNPQ" target="_blank" className="text-sky-500 font-bold">Discord</a> and become a contributor.</p>

            <a href="https://github.com/helicon/helicone" target="_blank" className="text-gray-500 font-bold border-2 rounded-lg mt-2 p-1 px-2 flex items-center gap-1">
              Fork Helicone
              <ChevronRightIcon className="w-5 h-5" />
            </a>
          </div>

          <Image src="/static/contributors.png" alt="Contributors" width={500} height={400} />
        </div>

        <div className="flex flex-col items-start justify-evenly border-2 rounded-2xl pt-6 min-w-[350px] md:min-w-[500px]">
          <div className="flex flex-col items-auto px-6 gap-2">
            <h3 className="text-lg font-bold">Deploy on-prem</h3>
            <p className="text-sm text-gray-400">Cloud-host or deploy on-prem with our production-ready HELM chart for maximum security. Chat with us about other options.</p>

            <Link href="/contact" className="text-gray-500 font-bold border-2 rounded-lg mt-2 p-1 px-2 flex items-center gap-1 w-fit">
              Get in touch
              <ChevronRightIcon className="w-5 h-5" />
            </Link>
          </div>

          <Image className="self-end" src="/static/deploy-cube.png" alt="Deploy on prem" width={265} height={300} />
        </div>

      </div>
    </div>
  );
}