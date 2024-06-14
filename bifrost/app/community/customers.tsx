import { clsx } from "@/utils/clsx";
import Link from "next/link";

interface ProjectTag {
  name: string;
  href: string;
}

const TAGS: Record<string, ProjectTag> = {
  learning: {
    name: "Learning",
    href: "",
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
  },
  {
    title: "Filevine",
    logoHref: "/static/filevine.webp",
    linkHref: "https://www.filevine.com/",
  },
  {
    title: "Mintlify",
    logoHref: "/static/mintlify.svg",
    linkHref: "https://mintlify.com/",
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
  },
  {
    title: "Codegen",
    logoHref: "/static/customers/codegen.png",
    linkHref: "https://www.codegen.com/",
  },
  {
    title: "Lex Pages",
    logoHref: "/static/customers/lex.svg",
    linkHref: "https://lex.page/",
    className: "p-7",
  },
];

export function Customers() {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-lg md:max-w-4xl">
        {customers.map((customer, i) => {
          return (
            <Link
              className="h-fit flex flex-col gap-3 w-full hover:bg-sky-50 rounded-lg p-8 col-span-1 md:col-span-1 pt-10"
              href={customer.linkHref}
              key={`${i}-${customer.title}`}
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
      And thousands more...
    </div>
  );
}
