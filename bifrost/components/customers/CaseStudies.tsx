import { getMetadata } from "@/components/templates/customers/getMetaData";
import { CustomerCard } from "@/components/customers/CustomerCard";

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
    date: metadata?.date || "",
  };
}

export function formatCustomerSince(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

export function formatLastUpdated(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
export type CaseStudyStructure = {
  dynamicEntry: {
    folderName: string;
  };
};

const caseStudies: CaseStudyStructure[] = [
  { dynamicEntry: { folderName: "deepai" } },
  { dynamicEntry: { folderName: "cogna" } },
  { dynamicEntry: { folderName: "tusk" } },
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
    <div className="relative w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mx-auto max-w-5xl h-full py-8 md:py-12 px-4 sm:px-6">
      {customersWithMetadata.map((customer) => (
        <CustomerCard
          key={customer.dynamicEntry?.folderName}
          href={`/customers/${customer.dynamicEntry?.folderName}`}
          logo={customer.logo}
          title={customer.title}
          subtitle={`Customer since ${formatCustomerSince(
            customer.customerSince
          )}`}
        />
      ))}
    </div>
  );
}
