import Link from "next/link";
import { clsx } from "../../shared/clsx";
import Image from "next/image";
import { BlogStructure } from "../../../pages/blog";
import NavBarV2 from "../../layout/navbar/navBarV2";
import Footer from "../../layout/footer";

interface BlogPageProps {
  content: BlogStructure[];
}

const BlogPage = (props: BlogPageProps) => {
  const { content } = props;

  return (
    <div className="w-full bg-[#f8feff] h-full antialiased relative">
      <NavBarV2 />
      <div className="relative w-full flex flex-col space-y-4 mx-auto max-w-5xl h-full py-16 items-center text-center px-2 sm:px-2 lg:px-0">
        <Image
          src={"/assets/pricing/bouncing-cube.png"}
          alt={"bouncing-cube"}
          width={200}
          height={100}
        />
        <h1 className="text-5xl font-bold text-gray-900">The Helicone Blog</h1>
        <p className="text-lg text-gray-700">
          Thoughts about the future of AI - from the team helping to build it.
        </p>
        <div className="border-b border-gray-300 py-4 w-full flex items-center justify-center">
          {/* <ul className="flex items-center space-x-4">
            <li className="flex items-center space-x-1 px-4 py-2 bg-gray-300 rounded-lg">
              <StarIcon className="h-5 w-5 text-yellow-500" />
              <span className="text-gray-600">Latest</span>
            </li>
            <li className="flex items-center space-x-1 px-4 py-2 bg-gray-300 rounded-lg">
              <StarIcon className="h-5 w-5 text-yellow-500" />
              <span className="text-gray-600">Latest</span>
            </li>
            <li className="flex items-center space-x-1 px-4 py-2 bg-gray-300 rounded-lg">
              <StarIcon className="h-5 w-5 text-yellow-500" />
              <span className="text-gray-600">Latest</span>
            </li>
          </ul> */}
        </div>
        <div className="grid grid-cols-2 space-y-8">
          {/* render the featured one in two columns, otherwise, render it regularly in the grid */}
          {content.map((blog, i) => {
            if (i === 0) {
              return (
                <Link
                  id="featured"
                  className="flex items-start gap-8 w-full hover:bg-sky-50 rounded-lg p-8 col-span-2"
                  href={blog.href}
                  key={i}
                >
                  <div className="w-[36rem] h-full rounded-lg flex flex-col space-y-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-50 text-blue-700 ring-blue-200 w-max items-center rounded-lg px-2 py-1 -my-1 text-sm font-medium ring-1 ring-inset">
                        /{blog.badgeText.toLowerCase()}
                      </span>
                      <span className="text-gray-400 text-sm">-</span>
                      <span className="text-gray-400 text-sm">
                        4 minute read
                      </span>
                    </div>

                    <h2 className="font-semibold text-3xl pt-2">
                      {blog.title}
                    </h2>
                    <p className="text-gray-500 text-md">{blog.description}</p>
                    <div className="flex flex-row justify-between gap-4 items-center py-4">
                      <div
                        className={clsx("flex items-center space-x-3 bottom-0")}
                      >
                        {blog.authors.map((author, i) => (
                          <div className="flex items-center space-x-2" key={i}>
                            <img
                              className="inline-block h-8 w-8 rounded-full"
                              src={author.imageUrl}
                              alt=""
                            />
                            <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                              {author.name}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 pr-4">
                        <time>{blog.date}</time>
                      </p>
                    </div>
                  </div>
                  <img
                    src={blog.imageUrl}
                    alt={blog.title}
                    width={400}
                    height={300}
                    style={{
                      objectFit: "cover",
                    }}
                    className="rounded-lg h-96 w-full border border-gray-300"
                  />
                </Link>
              );
            } else {
              return (
                <Link
                  id="featured"
                  className="flex flex-col gap-6 w-full hover:bg-sky-50 rounded-lg p-8 col-span-1"
                  href={blog.href}
                  key={i}
                >
                  <img
                    src={blog.imageUrl}
                    alt={blog.title}
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
                          blog.badgeColor,
                          "w-max items-center rounded-lg px-2 py-1 -my-1 text-sm font-medium ring-1 ring-inset"
                        )}
                      >
                        /{blog.badgeText.toLowerCase()}
                      </span>
                      <span className="text-gray-400 text-sm">-</span>
                      <span className="text-gray-400 text-sm">
                        4 minute read
                      </span>
                    </div>
                    <h2 className="font-semibold text-lg pt-2">{blog.title}</h2>
                    <p className="text-gray-500 text-sm">{blog.description}</p>
                    <div className="flex flex-row justify-between gap-4 items-center py-4">
                      <div
                        className={clsx("flex items-center space-x-3 bottom-0")}
                      >
                        {blog.authors.map((author, i) => (
                          <div className="flex items-center space-x-2" key={i}>
                            <img
                              className="inline-block h-8 w-8 rounded-full"
                              src={author.imageUrl}
                              alt=""
                            />
                            <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                              {author.name}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 pr-4">
                        <time>{blog.date}</time>
                      </p>
                    </div>
                  </div>
                </Link>
              );
            }
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BlogPage;
