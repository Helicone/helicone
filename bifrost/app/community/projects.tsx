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

interface Project {
  title: string;
  description: string;
  creators: {
    name: string;
    href: string;
  }[];
  imageHref: string;
  tags: ProjectTag[];
  href: string;
  isMonthlySpotlight?: true;
}

const projects: Project[] = [
  {
    title: "Deap Learning",
    description:
      "A group of students at Duke university are creating an online Youtube channel to teach deep learning concepts.",
    creators: [
      {
        name: "Anish",
        href: "",
      },
    ],
    imageHref: "/static/deep-learning.jpg",
    tags: [TAGS.learning],
    isMonthlySpotlight: true,
    href: "",
  },
];

export function Projects() {
  return (
    <div>
      <div className="md:gap-2 md:flex-row md:justify-start sm:items-start flex flex-col justify-start items-start  bg-[#F0F9FF] border-[#0CA5E9] border border-opacity-20 rounded-lg mx-[12px] p-[24px] mt-[24px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={"/static/community/stars_icon.svg"}
          alt="Deep Learning"
          className="h-[24px]"
        />
        <div className="mt-[24px] text-[#0CA5E9] font-bold sm:mt-0 sm:whitespace-nowrap">
          Using Helicone?{" "}
        </div>
        <div className="text-[#0CA5E9] sm:whitespace-nowrap">
          We want to know what you are building!{" "}
        </div>

        <Link
          href={"https://forms.gle/WpTEEE6vVdQccprD9"}
          className="text-[#0CA5E9] sm:whitespace-nowrap"
        >
          <u className=" hover:text-[#0CA5E9] font-semibold">
            Fill out this form
          </u>{" "}
          to be featured.
        </Link>
      </div>
    </div>
  );
  return (
    <div className="grid grid-cols-2 space-y-8">
      {projects.map((project, i) => {
        return (
          <Link
            id="featured"
            className="flex flex-col gap-6 w-full hover:bg-sky-50 rounded-lg p-8 col-span-2 md:col-span-1"
            href={project.href}
            key={i}
          >
            {/*eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.imageHref}
              alt={project.title}
              width={400}
              height={300}
              style={{
                objectFit: "cover",
              }}
              className="rounded-lg h-60 w-full border border-gray-300"
            />
            <div className="w-full h-fit rounded-lg flex flex-col space-y-2 text-left">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "bg-sky-50 text-sky-700 ring-sky-600/10 w-max items-center rounded-lg px-2 py-1 -my-1 text-sm font-medium ring-1 ring-inset"
                  )}
                >
                  {project.tags.length}
                </span>
                <span className="text-gray-400 text-sm">-</span>
              </div>
              <h2 className="font-semibold text-lg pt-2">{project.title}</h2>
              <p className="text-gray-500 text-sm">{project.description}</p>
              <div className="flex flex-row justify-between gap-4 items-center py-4">
                <div className={clsx("flex items-center space-x-3 bottom-0")}>
                  {project.creators.map((creator, i) => (
                    <div className="flex items-center space-x-2" key={i}>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {creator.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
