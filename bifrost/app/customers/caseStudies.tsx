import { getMetadata } from "@/components/templates/customers/getMetaData";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

interface CaseStudy {
  title: string;
  description: string;
  logo: string;
  url: string;
  customerSince: string;
  isOpenSourced?: true;
  dynamicEntry?: {
    folderName: string;
  };
  date: string;
}

type UnPromise<T> = T extends Promise<infer U> ? U : T;

function metaDataToCaseStudyStructure(
  folderName: string,
  metadata: UnPromise<ReturnType<typeof getMetadata>>
): Omit<CaseStudy, "dynamicEntry"> {
  if (!metadata) {
    throw new Error(`Metadata is null for folder: ${folderName}`);
  }
  return {
    title: metadata.title,
    description: metadata.description,
    logo: metadata.logo,
    url: metadata.url,
    customerSince: metadata.customerSince,
    isOpenSourced: metadata.isOpenSourced,
    date: metadata?.date || "",
  };
}

function formatCustomerSince(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

export type CaseStudyStructure = {
  dynamicEntry: {
    folderName: string;
  };
};

const caseStudies: CaseStudyStructure[] = [
  { dynamicEntry: { folderName: "cogna" } },
  { dynamicEntry: { folderName: "usetusk" } },
  { dynamicEntry: { folderName: "wordware" } },
];

export async function CaseStudies() {
  const customersWithMetadata: CaseStudy[] = await Promise.all(
    caseStudies.map(async ({ dynamicEntry }) => {
      const metadata = await getMetadata(dynamicEntry.folderName);
      return {
        ...metaDataToCaseStudyStructure(dynamicEntry.folderName, metadata),
        dynamicEntry,
      };
    })
  );

  return (
    <div className="w-full bg-gradient-to-b min-h-screen antialiased relative text-accent-foreground">
      <div className="relative w-full flex flex-col mx-auto max-w-5xl h-full py-8 md:py-12 items-center text-center px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {customersWithMetadata.map((customer) => (
            <Link
              key={customer.dynamicEntry?.folderName}
              href={`/customers/${customer.dynamicEntry?.folderName}`}
              className="flex flex-col gap-2 p-4 sm:gap sm:p-2 w-full  hover:bg-sky-50 rounded-xl transition-all duration-300 text-left group"
            >

              {/* Logo */}
              <div className="overflow-hidden rounded-xl relative group aspect-[16/9] w-full bg-slate-100 flex items-center justify-center group-hover:bg-sky-100 transition-all duration-300">
                {customer.logo ? (
                  <Image
                    src={customer.logo}
                    alt={`${customer.title} logo`}
                    width={120}
                    height={64}
                    className="object-contain transform group-hover:scale-110 transition-transform duration-300 max-h-full max-w-full grayscale group-hover:grayscale-0"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                    Logo missing
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="w-full h-fit flex flex-col gap-2 p-2">
                <h2 className="font-bold text-lg leading-snug tracking-tight line-clamp-2">
                  {customer.title}
                </h2>
                <span className="text-muted-foreground text-sm">
                  Customer since {formatCustomerSince(customer.customerSince)}
                </span>
                <span className="flex items-center text-accent-foreground text-sm font-medium pt-2">
                  Read story
                  <ChevronRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
