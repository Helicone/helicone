import { getMetadata } from "@/components/templates/customers/getMetaData";
import Link from "next/link";
import Image from "next/image";

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
): CaseStudy {
  if (!metadata) {
    throw new Error("Metadata is null");
  }
  return {
    title: metadata.title,
    description: metadata.description,
    logo: metadata.logo,
    url: metadata.url,
    customerSince: metadata.customerSince,
    isOpenSourced: metadata.isOpenSourced,
    date: metadata?.date ?? "",
  };
}

export type CaseStudyStructure =
  {
    dynamicEntry: {
      folderName: string;
    };
  };

const caseStudies: CaseStudyStructure[] = [
  {
    dynamicEntry: {
      folderName: "cogna",
    },
  },
  {
    dynamicEntry: {
      folderName: "usetusk",
    },
  },
  {
    dynamicEntry: {
      folderName: "wordware",
    },
  },
];

export async function CaseStudies() {
  // Load metadata for all dynamic entries first
  const dynamicMetadata = new Map();

  for (const customer of caseStudies) {
    if (customer.dynamicEntry) {
      const metadata = await getMetadata(customer.dynamicEntry.folderName);
      dynamicMetadata.set(customer.dynamicEntry.folderName, metadata);
    }
  }

  // Transform caseStudies to include metadata
  const customersWithMetadata = caseStudies.map(customer => {
    const metadata = dynamicMetadata.get(customer.dynamicEntry.folderName);
    return {
      ...metaDataToCaseStudyStructure(customer.dynamicEntry.folderName, metadata),
      dynamicEntry: customer.dynamicEntry // Keep the dynamicEntry for the key/href
    };
  });

  return (
    <div className="w-full bg-gradient-to-b bg-white min-h-screen antialiased relative text-black">
      <div className="relative w-full flex flex-col mx-auto max-w-7xl h-full py-8 md:py-12 items-center text-center px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {customersWithMetadata.map((customer) => (
            <Link
              key={customer.dynamicEntry?.folderName}
              href={`/customers/${customer.dynamicEntry?.folderName}`}
              className="flex flex-col gap-4 md:gap-6 p-2 md:p-4 w-full  hover:bg-sky-100 rounded-xl transition-all duration-300 text-left"
            >
              <div className="overflow-hidden rounded-xl relative group aspect-[16/9] w-full bg-slate-100 flex items-center justify-center">
                {customer.logo ? (
                  <Image
                    src={customer.logo}
                    alt={`${customer.title} logo`}
                    width={120}
                    height={56}
                    style={{ objectFit: "contain" }}
                    className="object-contain transform group-hover:scale-105 transition-transform duration-300 max-h-full max-w-full grayscale group-hover:grayscale-0"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                    Logo missing
                  </div>
                )}
              </div>

              <div className="w-full h-fit flex flex-col space-y-2 px-2">
                <h2 className="font-bold text-lg leading-snug tracking-tight line-clamp-2">
                  {customer.title}
                </h2>
                <div className="flex items-center gap-2 text-slate-500 text-sm pt-2">
                  <span>Customer since {new Date(customer.customerSince).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
