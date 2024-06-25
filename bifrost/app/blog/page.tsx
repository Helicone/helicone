// import BlogPage from "../../components/templates/blog/blogPage";
import { clsx } from "@/components/shared/utils";
import Image from "next/image";
import Link from "next/link";

export type BlogStructure = {
  title: string;
  description: string;
  badgeText: string;
  date: string;
  href: string;
  imageUrl: string;
  authors: {
    name: string;
    imageUrl: string;
  }[];
  time: string; // the amount of time it takes to read the blog
};

const blogContent: BlogStructure[] = [
  {
    title: "Best Practices for AI Developers: Full Guide (June 2024)",
    description:
      "Achieving high performance requires robust observability practices. In this blog, we will explore the key challenges of building with AI and the best practices to help you advance your AI development.",
    badgeText: "guide",
    date: "June 20, 2024",
    href: "/blog/ai-best-practices",
    imageUrl: "/static/blog/ai-best-practices/cover.png",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
      },
    ],
    time: "6 minute read",
  },
  {
    title: "I built my first AI app and integrated it with Helicone",
    description:
      "So, I decided to make my first AI app with Helicone - in the spirit of getting a first-hand exposure to our user's pain points.",
    badgeText: "guide",
    date: "June 18, 2024",
    href: "/blog/first-ai-app-with-helicone",
    imageUrl: "/static/blog/first-ai-app/lina-first-ai-app.png",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
      },
    ],
    time: "6 minute read",
  },
  {
    title: "How to Understand Your Users Better and Deliver a Top-Tier Experience with Custom Properties",
    description:
      "In today's digital landscape, every interaction, click, and engagement offers valuable insights into your users' preferences. But how do you harness this data to effectively grow your business? We may have the answer. ",
    badgeText: "feature",
    date: "June 14, 2024",
    href: "/blog/custom-properties",
    imageUrl: "/static/blog/custom-properties/cover.png",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
      },
    ],
    time: "6 minute read",
  },
  {
    title: "Helicone vs. Weights and Biases",
    description:
      "Training modern LLMs is generally less complex than traditional ML models. Here's how to have all the essential tools specifically designed for language model observability without the clutter.",
    badgeText: "compare",
    date: "May 31, 2024",
    href: "/blog/weights-and-biases",
    imageUrl: "/static/blog/weights-and-biases.png",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
      },
    ],
    time: "5 minute read",
  },
  {
    title: "Insider Scoop: Our Co-founder's Take on GitHub Copilot",
    description:
      "No BS, no affiliations, just genuine opinions from Helicone's co-founder.",
    badgeText: "team's pick",
    date: "May 30, 2024",
    href: "/blog/cole-github-copilot",
    imageUrl: "/static/blog/cole-copilot.png",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
      },
    ],
    time: "4 minute read",
  },
  {
    title: "Insider Scoop: Our Founding Engineer's Take on PostHog",
    description:
      "No BS, no affiliations, just genuine opinions from the founding engineer at Helicone.",
    badgeText: "team's pick",
    date: "May 23, 2024",
    href: "/blog/stefan-posthog",
    imageUrl: "/static/blog/stefan-posthog/posthog-cover.png",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
      },
    ],
    time: "3 minute read",
  },
  {
    title: "A step by step guide to switch to gpt-4o safely with Helicone",
    description:
      "Learn how to use Helicone's experiments features to regression test, compare and switch models.",
    badgeText: "Product",
    date: "May 14, 2024",
    href: "/blog/switch-models-safely",
    imageUrl: "static/blog/experiments/gpt-4o.png",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/static/blog/scottnguyen-headshot.webp",
      },
    ],
    time: "5 minute read",
  },
  {
    title: "A Guide for Datadog Users Building with LLMs",
    description:
      "Datadog has long been a favourite among developers for monitoring and observability. But recently, LLM developers have been exploring new options. Why? We have some answers.",
    badgeText: "Compare",
    date: "Apr 29, 2024",
    href: "/blog/datadog",
    imageUrl: "static/blog/datadog/title.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
      },
    ],
    time: "4 minute read",
  },
  {
    title:
      "A LangSmith Alternative that Takes LLM Observability to the Next Level",
    description:
      "Both Helicone and LangSmith are capable, powerful DevOps platform used by enterprises and developers building LLM applications. But which is better?",
    badgeText: "Compare",
    date: "Apr 18, 2024",
    href: "/blog/langsmith",
    imageUrl: "static/blog/langsmith-vs-helicone/cover-image.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
      },
    ],
    time: "4 minute read",
  },
  {
    "title": "Why Observability is the Key to Ethical and Safe Artificial Intelligence",
    "description": "As AI continues to shape our world, the need for ethical practices and robust observability has never been greater. Learn how Helicone is rising to the challenge.",
    "badgeText": "Read",
    "date": "Sep 19, 2023",
    "href": "/blog/ai-safety",
    "imageUrl": "/static/blog/AI.webp",
    "authors": [
      {
        "name": "Scott Nguyen",
        "imageUrl": "/static/blog/scottnguyen-headshot.webp"
      }
    ],
    "time": "7 minute read"
  }, 
  {
    "title": "The Next Evolution in OpenAI Monitoring and Optimization",
    "description": "Learn how Helicone provides unmatched insights into your OpenAI usage, allowing you to monitor, optimize, and take control like never before.",
    "badgeText": "Education",
    "date": "Sep 1, 2023",
    "href": "/blog/open-source-monitoring-for-openai",
    "imageUrl": "/static/blog/openai.webp",
    "authors": [
      {
        "name": "Scott Nguyen",
        "imageUrl": "/static/blog/scottnguyen-headshot.webp"
      }
    ],
    "time": "3 minute read"
  }, 
  {
    "title": "Life after Y Combinator: Three Key Lessons for Startups",
    "description": "From maintaining crucial relationships to keeping a razor-sharp focus, here's how to sustain your momentum after the YC batch ends.",
    "badgeText": "Advice",
    "date": "Mar 12, 2024",
    "href": "/blog/life-after-yc",
    "imageUrl": "/static/blog/yc.webp",
    "authors": [
      {
        "name": "Scott Nguyen",
        "imageUrl": "/static/blog/scottnguyen-headshot.webp"
      }
    ],
    "time": "4 minute read"
  }, 
  // {
  //   "title": "AutoGPT x Helicone: Optimizing Evaluation Pipelines",
  //   "description": "Helicone is excited to announce a partnership with AutoGPT, the leader in agent development! Discover how AutoGPT leverages Helicone to build the optimal evaluation pipeline for agent comparison, enhancing workflow efficiency and cost savings.",
  //   "badgeText": "Partnership",
  //   "date": "Jul 30, 2023",
  //   "href": "/blog/autoGPT",
  //   "imageUrl": "/static/blog/autogpt.webp",
  //   "authors": [
  //     {
  //       "name": "Justin Torre",
  //       "imageUrl": "/static/blog/justintorre-headshot.webp"
  //     }
  //   ],
  //   "time": "8 minute read"
  // }
];

const Blog = () => {
  return (
    <div className="w-full bg-[#f8feff] h-full antialiased relative text-black">
      <div className="relative w-full flex flex-col space-y-4 mx-auto max-w-5xl h-full py-16 items-center text-center px-2 sm:px-2 lg:px-0">
        <Image
          src={"/static/pricing/bouncing-cube.webp"}
          alt={"bouncing-cube"}
          width={200}
          height={100}
        />
        <h1 className="text-5xl font-bold text-gray-900 pt-4">The Helicone Blog</h1>
        <p className="text-lg text-gray-700">
          Thoughts about the future of AI - from the team helping to build it.
        </p>
        <div className="border-b border-gray-300 py-4 w-full flex items-center justify-center"></div>
        <div className="grid grid-cols-2 space-y-8">
          {blogContent.map((blog, i) => {
            if (i === 0) {
              return (
                <Link
                  id="featured"
                  className="flex flex-col md:flex-row items-start gap-8 w-full hover:bg-sky-50 rounded-lg p-8 col-span-2"
                  href={blog.href}
                  key={i}
                >
                  <div className="w-full md:w-[36rem] h-full rounded-lg flex flex-col space-y-4 text-left order-2 md:order-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-50 text-blue-700 ring-blue-200 w-max items-center rounded-lg px-2 py-1 -my-1 text-sm font-medium ring-1 ring-inset">
                        / {blog.badgeText.toLowerCase()}
                      </span>
                      <span className="text-gray-400 text-sm">-</span>
                      <span className="text-gray-400 text-sm">{blog.time}</span>
                    </div>

                    <h2 className="font-semibold text-2xl pt-2">
                      {blog.title}
                    </h2>
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
                  <img
                    src={blog.imageUrl}
                    alt={blog.title}
                    width={400}
                    height={300}
                    style={{
                      objectFit: "cover",
                    }}
                    className="rounded-lg h-full md:h-96 w-full max-w-[36rem] border border-gray-300 order-1 md:order-2"
                  />
                </Link>
              );
            } else {
              return (
                <Link
                  id="featured"
                  className="flex flex-col gap-6 w-full hover:bg-sky-50 rounded-lg p-8 col-span-2 md:col-span-1"
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
                          "bg-sky-50 text-sky-700 ring-sky-600/10 w-max items-center rounded-lg px-2 py-1 -my-1 text-sm font-medium ring-1 ring-inset"
                        )}
                      >
                        / {blog.badgeText.toLowerCase()}
                      </span>
                      <span className="text-gray-400 text-sm">-</span>
                      <span className="text-gray-400 text-sm">{blog.time}</span>
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
    </div>
  );
};

export default Blog;
