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
}

const customers: Customer[] = [
  {
    title: "Greptile",
    logoHref: "/static/greptile.webp",
    linkHref: "",
  },
  {
    title: "Greptile2",
    logoHref: "/static/greptile.webp",
    linkHref: "",
  },
  {
    title: "Greptile3",
    logoHref: "/static/greptile.webp",
    linkHref: "",
  },
  {
    title: "Greptile4",
    logoHref: "/static/greptile.webp",
    linkHref: "",
  },
  {
    title: "Greptile5",
    logoHref: "/static/greptile.webp",
    linkHref: "",
  },
];

export function Customers() {
  return (
    <div className="grid grid-cols-2 gap-2">
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
                objectFit: "cover",
              }}
              className="rounded-lg"
            />
          </Link>
        );
      })}
    </div>
  );
}
