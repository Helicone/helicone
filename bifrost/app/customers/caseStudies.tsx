import { getMetadata } from "@/components/templates/customers/getMetaData";
import Link from "next/link";
import Image from "next/image";

interface CaseStudy {
  title: string;
  description: string;
  logo: string;
  href: string;
  url: string;
  partnerSince: string;
  isOpenSourced?: true;
  dynamicEntry?: {
    folderName: string;
  };
}

const caseStudies: CaseStudy[] = [
  {
    title: "Chatwith",
    description:
      "Instantly answer questions with your custom no-code AI chatbot.",
    url: "https://chatwith.tools",
    partnerSince: "2024-01-01",
    isOpenSourced: true,
    logo: "/static/community/projects/chatwith.webp", // <- change this
    href: "https://chatwith.tools",
    dynamicEntry: {
      folderName: "chatwith",
    },
  },
  {
    title: "Greptile",
    description:
      "Instantly answer questions with your custom no-code AI chatbot.",
    url: "https://greptile.com",
    partnerSince: "2024-01-01",
    isOpenSourced: true,
    logo: "/static/community/projects/greptile.webp", // <- change this
    href: "https://greptile.com",
    dynamicEntry: {
      folderName: "greptile",
    },
  },
];

export async function CaseStudies({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  // Load metadata for all dynamic entries first
  const dynamicMetadata = new Map();

  for (const customer of caseStudies) {
    if (customer.dynamicEntry) {
      const metadata = await getMetadata(customer.dynamicEntry.folderName);
      dynamicMetadata.set(customer.dynamicEntry.folderName, metadata);
    }
  }

  return (
    <div className="w-full bg-gradient-to-b bg-white min-h-screen antialiased relative text-black">
      <div className="relative w-full flex flex-col mx-auto max-w-7xl h-full py-8 md:py-12 items-center text-center px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {caseStudies.map((customer) => (
            <Link
              key={customer.title}
              href={`/customers/${customer.dynamicEntry?.folderName}`}
              className="flex flex-col gap-4 md:gap-6 p-2 md:p-4 w-full bg-white hover:bg-sky-50 border border-gray-200 hover:border-sky-100 rounded-xl pb-4 md:pb-6 transition-all duration-300 text-left"
            >
              <div className="overflow-hidden rounded-xl relative group aspect-[16/9] w-full bg-gray-100 flex items-center justify-center">
                <Image
                  src={customer.logo}
                  alt={`${customer.title} logo`}
                  width={100}
                  height={56}
                  style={{ objectFit: "contain" }}
                  className="rounded-xl object-contain transform group-hover:scale-105 transition-transform duration-300 max-h-full max-w-full"
                />
              </div>

              <div className="w-full h-fit flex flex-col space-y-2 px-1 md:px-0">
                <h2 className="font-bold text-lg leading-snug tracking-tight line-clamp-2">
                  {customer.title}
                </h2>
                <p className="text-slate-500 text-sm line-clamp-2 md:line-clamp-3">
                  {customer.description}
                </p>
                <div className="flex items-center gap-2 text-slate-500 text-sm pt-2">
                  <span>{customer.isOpenSourced ? "Open Source" : "Partner"}</span>
                  <span>•</span>
                  <span>Since {new Date(customer.partnerSince).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
