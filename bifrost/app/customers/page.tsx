import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { clsx } from "@/utils/clsx";
import { H1, P, Small } from "@/components/ui/typography";

export const metadata: Metadata = {
    title: "Helicone Customers | Companies Using Our Platform",
    description:
        "Discover the companies and organizations that trust Helicone for their AI observability needs. Join our growing list of satisfied customers.",
    icons: "https://www.helicone.ai/static/logo.webp",
    openGraph: {
        type: "website",
        siteName: "Helicone.ai",
        url: "https://www.helicone.ai/customers",
        title: "Helicone Customers | Companies Using Our Platform",
        description:
            "Discover the companies and organizations that trust Helicone for their AI observability needs. Join our growing list of satisfied customers.",
        images: "/static/new-open-graph.png",
        locale: "en_US",
    },
    twitter: {
        title: "Helicone Customers | Companies Using Our Platform",
        description:
            "Discover the companies and organizations that trust Helicone for their AI observability needs. Join our growing list of satisfied customers.",
        card: "summary_large_image",
        images: "/static/new-open-graph.png",
    },
};

interface Customer {
    logoHref: string;
    linkHref: string;
    title: string;
    className?: string;
}

const customers: Customer[] = [
    {
        title: "Greptile",
        logoHref: "/static/greptile.webp",
        linkHref: "https://greptile.com/",
        className: "p-2",
    },
    {
        title: "Filevine",
        logoHref: "/static/filevine.webp",
        linkHref: "https://www.filevine.com/",
        className: "p-4",
    },
    {
        title: "Mintlify",
        logoHref: "/static/mintlify.svg",
        linkHref: "https://mintlify.com/",
        className: "p-4",
    },
    {
        title: "Journalist AI",
        logoHref: "/static/customers/journalist.svg",
        linkHref: "https://tryjournalist.com/",
    },
    {
        title: "QA Wolf",
        logoHref: "/static/customers/qa_wolf.svg",
        linkHref: "https://qawolf.com/",
        className: "p-4",
    },
    {
        title: "Codegen",
        logoHref: "/static/customers/codegen.png",
        linkHref: "https://www.codegen.com/",
        className: "p-4",
    },
    {
        title: "Lex Pages",
        logoHref: "/static/customers/lex.svg",
        linkHref: "https://lex.page/",
        className: "p-8",
    },
];

// Separate the customer grid from the page layout for better reusability
export function CustomerGrid() {
    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg md:max-w-4xl p-8">
                {customers.map((customer, i) => {
                    return (
                        <Link
                            className="h-fit flex flex-col gap-4 w-full hover:bg-sky-50 rounded-lg p-4 col-span-2 md:col-span-1"
                            href={customer.linkHref}
                            key={`${i}-${customer.title}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {/*eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={customer.logoHref}
                                alt={customer.title}
                                width={400}
                                height={300}
                                style={{
                                    objectFit: "contain",
                                }}
                                className={clsx("rounded-lg h-[100px]", customer.className)}
                            />
                        </Link>
                    );
                })}
            </div>
            <Small className="text-muted-foreground font-semibold sm:mt-0 sm:whitespace-nowrap">
                And thousands more...
            </Small>
        </div>
    );
}

// This is the component that will be used in other pages
export function Customers() {
    return <CustomerGrid />;
}

export default function Page() {
    return (
        <div className="w-full bg-background h-full antialiased relative text-foreground mb-6">
            <div className="relative w-full flex flex-col gap-4 mx-auto max-w-5xl h-full py-16 items-center text-center px-2 sm:px-2 lg:px-0">
                <Image
                    src={"/static/community/shiny-cube.webp"}
                    alt={"shiny-cube"}
                    width={200}
                    height={100}
                />
                <H1>Customers</H1>
                <P className="text-muted-foreground">
                    Companies and organizations that trust Helicone for their AI observability needs.
                </P>

                <CustomerGrid />
            </div>
        </div>
    );
} 