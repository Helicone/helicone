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
    <div className="relative mx-auto grid h-full w-full max-w-5xl grid-cols-1 gap-2 px-4 py-8 sm:grid-cols-2 sm:px-6 md:py-12">
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
