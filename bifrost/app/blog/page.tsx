import { clsx } from "@/components/shared/utils";
import Image from "next/image";
import Link from "next/link";
import { getMetadata } from "@/components/templates/blog/getMetaData";

type BlogPostProps = {
  blog: BlogStructure;
};

type UnPromise<T> = T extends Promise<infer U> ? U : T;

const HEADSHOTS = {
  "Cole Gottdank": "/static/blog/colegottdank-headshot.webp",
  "Lina Lam": "/static/blog/linalam-headshot.webp",
  "Stefan Bokarev": "/static/blog/stefanbokarev-headshot.webp",
  "Justin Torre": "/static/blog/justintorre-headshot.webp",
  "Scott Nguyen": "/static/blog/scottnguyen-headshot.webp",
};

function metaDataToBlogStructure(
  folderName: string,
  metadata: UnPromise<ReturnType<typeof getMetadata>>
): ManualBlogStructure {
  if (!metadata) {
    throw new Error("Metadata is null");
  }
  return {
    authors:
      metadata.authors && metadata.authors.length > 0
        ? metadata.authors.map((author) => ({
            name: author,
            imageUrl: HEADSHOTS[author as keyof typeof HEADSHOTS],
          }))
        : [
            {
              name: metadata.author || "",
              imageUrl: HEADSHOTS[metadata.author as keyof typeof HEADSHOTS],
            },
          ],
    title: metadata.title,
    description: metadata.description,
    badgeText: "insight",
    date: metadata?.date ?? "",
    href: `/blog/${folderName}`,
    imageUrl: metadata?.images ?? "",
    time: metadata?.time ?? "",
  };
}

const RegularBlogPost: React.FC<BlogPostProps> = async ({ blog }) => {
  if ("dynmaicEntry" in blog) {
    const metadata = await getMetadata(blog.dynmaicEntry.folderName);
    blog = metaDataToBlogStructure(blog.dynmaicEntry.folderName, metadata);
  }

  return (
    <Link
      id="featured"
      className="flex flex-col gap-6 w-full hover:bg-sky-50 rounded-lg p-8 col-span-2 md:col-span-1"
      href={blog.href}
    >
      <img
        src={blog.imageUrl}
        alt={blog.imageAlt || blog.title}
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
          <div className={clsx("flex items-center space-x-3 bottom-0")}>
            {blog.authors.map((author, i) => (
              <div className="flex items-center space-x-2" key={i}>
                <img
                  className="inline-block h-8 w-8 rounded-full"
                  src={author.imageUrl}
                  alt={author.imageAlt || ""}
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
};

const FeaturedBlogPost: React.FC<BlogPostProps> = async ({ blog }) => {
  if ("dynmaicEntry" in blog) {
    const metadata = await getMetadata(blog.dynmaicEntry.folderName);
    blog = metaDataToBlogStructure(blog.dynmaicEntry.folderName, metadata);
  }

  return (
    <Link
      id="featured"
      className="flex flex-col md:flex-row items-start gap-8 w-full hover:bg-sky-50 rounded-lg p-8 col-span-2"
      href={blog.href}
    >
      <div className="w-full md:w-1/2 h-full rounded-lg flex flex-col space-y-4 text-left order-2 md:order-1">
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 text-blue-700 ring-blue-200 w-max items-center rounded-lg px-2 py-1 -my-1 text-sm font-medium ring-1 ring-inset">
            / {blog.badgeText.toLowerCase()}
          </span>
          <span className="text-gray-400 text-sm">-</span>
          <span className="text-gray-400 text-sm">{blog.time}</span>
        </div>

        <h2 className="font-semibold text-3xl pt-2">{blog.title}</h2>
        <p className="text-gray-500 text-base">{blog.description}</p>
        <div className="flex flex-row justify-between gap-4 items-center py-4">
          <div className={clsx("flex items-center space-x-3 bottom-0")}>
            {blog.authors.map((author, i) => (
              <div className="flex items-center space-x-2" key={i}>
                <img
                  className="inline-block h-10 w-10 rounded-full"
                  src={author.imageUrl}
                  alt={author.imageAlt || ""}
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
        alt={blog.imageAlt || blog.title}
        width={600}
        height={400}
        style={{
          objectFit: "cover",
        }}
        className="rounded-lg h-72 w-full md:w-1/2 border border-gray-300 order-1 md:order-2"
      />
    </Link>
  );
};

type ManualBlogStructure = {
  title: string;
  description: string;
  badgeText: string;
  date: string;
  href: string;
  imageUrl: string;
  imageAlt?: string; // Alt text for cover image (optional)
  authors: {
    name: string;
    imageUrl: string;
    imageAlt?: string; // Alt text for author's headshot (optional)
  }[];
  time: string; // the amount of time it takes to read the blog
};

export type BlogStructure =
  | ManualBlogStructure
  | {
      dynmaicEntry: {
        folderName: string;
      };
    };

const blogContent: BlogStructure[] = [
  {
    dynmaicEntry: {
      folderName: "braintrust-alternatives",
    },
  },
  {
    dynmaicEntry: {
      folderName: "replaying-llm-sessions",
    },
  },
  {
    dynmaicEntry: {
      folderName: "helicone-recap",
    },
  },
  {
    dynmaicEntry: {
      folderName: "prompt-engineering-tools",
    },
  },
  {
    dynmaicEntry: {
      folderName: "langchain-qawolf",
    },
  },
  {
    dynmaicEntry: {
      folderName: "ai-agent-builders",
    },
  },
  {
    dynmaicEntry: {
      folderName: "portkey-vs-helicone",
    },
  },
  {
    dynmaicEntry: {
      folderName: "slash-llm-cost",
    },
  },
  {
    dynmaicEntry: {
      folderName: "product-hunt-experience",
    },
  },
  {
    dynmaicEntry: {
      folderName: "product-hunt-automate",
    },
  },
  {
    dynmaicEntry: {
      folderName: "best-arize-alternatives",
    },
  },
  {
    dynmaicEntry: {
      folderName: "best-langfuse-alternatives",
    },
  },
  {
    dynmaicEntry: {
      folderName: "essential-helicone-features",
    },
  },
  {
    dynmaicEntry: {
      folderName: "redeem-promo-code",
    },
  },
  {
    dynmaicEntry: {
      folderName: "llm-stack-guide",
    },
  },
  {
    dynmaicEntry: {
      folderName: "building-an-llm-stack",
    },
  },
  {
    title: "What is Prompt Management?",
    description:
      "Iterating your prompts is the #1 way to optimize user interactions with large language models (LLMs). Should you choose Helicone, Pezzo, or Agenta? We will explore the benefits of choosing a prompt management tool and what to look for.",
    badgeText: "insight",
    date: "Aug 1, 2024",
    href: "/blog/prompt-management",
    imageUrl: "/static/blog/prompt-management/cover.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
        imageAlt: "Lina Lam's headshot",
      },
    ],
    time: "5 minute read",
  },
  {
    title:
      "Meta Releases SAM 2 and What It Means for Developers Building Multi-Modal AI",
    description:
      "Meta's release of SAM 2 (Segment Anything Model for videos and images) represents a significant leap in AI capabilities, revolutionizing how developers and tools like Helicone approach multi-modal observability in AI systems.",
    badgeText: "insight",
    date: "July 30, 2024",
    href: "/blog/sam-2",
    imageUrl: "/static/blog/sam-2-cover.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
        imageAlt: "Lina Lam's headshot",
      },
    ],
    time: "4 minute read",
  },
  {
    title: "What is LLM Observability and Monitoring?",
    description:
      "Building with LLMs in production (well) is incredibly difficult. You probably have heard of the word LLM observability'. What is it? How does it differ from traditional observability? What is observed? We have the answers. ",
    badgeText: "insight",
    date: "July 12, 2024",
    href: "/blog/llm-observability",
    imageUrl: "/static/blog/llm-observability-cover.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
        imageAlt: "Lina Lam's headshot",
      },
    ],
    time: "3 minute read",
  },
  {
    title: "Compare: The Best LangSmith Alternatives & Competitors",
    description:
      "Observability tools allow developers to monitor, analyze, and optimize AI model performance, which helps overcome the 'black box' nature of LLMs. But which LangSmith alternative is the best in 2024? We will shed some light.",
    badgeText: "compare",
    date: "July 10, 2024",
    href: "/blog/best-langsmith-alternatives",
    imageUrl: "/static/blog/best-langsmith-alternatives/langsmith-cover.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
        imageAlt: "Lina Lam's headshot",
      },
    ],
    time: "8 minute read",
  },
  {
    title:
      "Handling Billions of LLM Logs with Upstash Kafka and Cloudflare Workers",
    description:
      "We desperately needed a solution to these outages/data loss. Our reliability and scalability are core to our product.",
    badgeText: "technical deep dive",
    date: "July 1, 2024",
    href: "https://upstash.com/blog/implementing-upstash-kafka-with-cloudflare-workers",
    imageUrl: "/static/blog/kafka-cover.webp",
    authors: [
      {
        name: "Cole Gottdank",
        imageUrl: "/static/blog/colegottdank-headshot.webp",
        imageAlt: "Cole Gottdank's headshot",
      },
    ],
    time: "15 minute read",
  },
  {
    title: "Best Practices for AI Developers: Full Guide (June 2024)",
    description:
      "Achieving high performance requires robust observability practices. In this blog, we will explore the key challenges of building with AI and the best practices to help you advance your AI development.",
    badgeText: "guide",
    date: "June 20, 2024",
    href: "/blog/ai-best-practices",
    imageUrl: "/static/blog/ai-best-practices/cover.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
        imageAlt: "Lina Lam's headshot",
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
    imageUrl: "/static/blog/first-ai-app/lina-first-ai-app.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
        imageAlt: "Lina Lam's headshot",
      },
    ],
    time: "6 minute read",
  },
  {
    title:
      "How to Understand Your Users Better and Deliver a Top-Tier Experience with Custom Properties",
    description:
      "In today's digital landscape, every interaction, click, and engagement offers valuable insights into your users' preferences. But how do you harness this data to effectively grow your business? We may have the answer. ",
    badgeText: "feature",
    date: "June 14, 2024",
    href: "/blog/custom-properties",
    imageUrl: "/static/blog/custom-properties/cover.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
        imageAlt: "Lina Lam's headshot",
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
    imageUrl: "/static/blog/weights-and-biases.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
        imageAlt: "Lina Lam's headshot",
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
    imageUrl: "/static/blog/cole-copilot.webp",
    authors: [
      {
        name: "Cole Gottdank",
        imageUrl: "/static/blog/colegottdank-headshot.webp",
        imageAlt: "Cole Gottdank's headshot",
      },
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
        imageAlt: "Lina Lam's headshot",
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
    imageUrl: "/static/blog/stefan-posthog/posthog-cover.webp",
    authors: [
      {
        name: "Stefan Bokarev",
        imageUrl: "/static/blog/stefanbokarev-headshot.webp",
        imageAlt: "Stefan Bokarev's headshot",
      },
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
        imageAlt: "Lina Lam's headshot",
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
    imageUrl: "static/blog/experiments/gpt-4o.webp",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/static/blog/scottnguyen-headshot.webp",
        imageAlt: "Scott Nguyen's headshot",
      },
    ],
    time: "5 minute read",
  },
  {
    title: "An Open-Source Datadog Alternative for LLM Observability",
    description:
      "Datadog has long been a favourite among developers for its application monitoring and observability capabilities. But recently, LLM developers have been exploring open-source observability options. Why? We have some answers.",
    badgeText: "Compare",
    date: "Apr 29, 2024",
    href: "/blog/best-datadog-alternative-for-llm",
    imageUrl: "static/blog/datadog/title.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
        imageAlt: "Lina Lam's headshot",
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
        imageAlt: "Lina Lam's headshot",
      },
    ],
    time: "4 minute read",
  },
  {
    title:
      "Why Observability is the Key to Ethical and Safe Artificial Intelligence",
    description:
      "As AI continues to shape our world, the need for ethical practices and robust observability has never been greater. Learn how Helicone is rising to the challenge.",
    badgeText: "AI Safety",
    date: "Sep 19, 2023",
    href: "/blog/ai-safety",
    imageUrl: "/static/blog/AI.webp",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/static/blog/scottnguyen-headshot.webp",
        imageAlt: "Scott Nguyen's headshot",
      },
    ],
    time: "5 minute read",
  },
  {
    title:
      "Introducing Vault: The Future of Secure and Simplified Provider API Key Management",
    description:
      "Helicone's Vault revolutionizes the way businesses handle, distribute, and monitor their provider API keys, with a focus on simplicity, security, and flexibility.",
    badgeText: "Product",
    date: "Sep 13, 2023",
    href: "/blog/vault-introduction",
    imageUrl: "/static/blog/vault_asset.webp",
    authors: [
      {
        name: "Cole Gottdank",
        imageUrl: "/static/blog/colegottdank-headshot.webp",
        imageAlt: "Cole Gottdank's headshot",
      },
    ],
    time: "3 minute read",
  },
  {
    title: "Life after Y Combinator: Three Key Lessons for Startups",
    description:
      "From maintaining crucial relationships to keeping a razor-sharp focus, here's how to sustain your momentum after the YC batch ends.",
    badgeText: "Personal",
    date: "Sep 11, 2023",
    href: "/blog/life-after-yc",
    imageUrl: "/static/blog/yc.webp",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/static/blog/scottnguyen-headshot.webp",
        imageAlt: "Scott Nguyen's headshot",
      },
    ],
    time: "4 minute read",
  },
  {
    title: "Helicone: The Next Evolution in OpenAI Monitoring and Optimization",
    description:
      "Learn how Helicone provides unmatched insights into your OpenAI usage, allowing you to monitor, optimize, and take control like never before.",
    badgeText: "Education",
    date: "Sep 1, 2023",
    href: "/blog/open-source-monitoring-for-openai",
    imageUrl: "/static/blog/openai.webp",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/static/blog/scottnguyen-headshot.webp",
        imageAlt: "Scott Nguyen's headshot",
      },
    ],
    time: "3 minute read",
  },
  {
    title: "Helicone partners with AutoGPT",
    description:
      "Helicone is excited to announce a partnership with AutoGPT, the leader in agent development.",
    badgeText: "Partnership",
    date: "Jul 30, 2023",
    href: "/blog/autoGPT",
    imageUrl: "/static/blog/autogpt.webp",
    authors: [
      {
        name: "Justin Torre",
        imageUrl: "/static/blog/justintorre-headshot.webp",
        imageAlt: "Justin Torre's headshot",
      },
    ],
    time: "3 minute read",
  },
  {
    title: "Generative AI with Helicone",
    description:
      "In the rapidly evolving world of generative AI, companies face the exciting challenge of building innovative solutions while effectively managing costs, result quality, and latency. Enter Helicone, an open-source observability platform specifically designed for these cutting-edge endeavors.",
    badgeText: "External",
    date: "Jul 21, 2023",
    href: "https://dailybaileyai.com/software/helicone.php",
    imageUrl: "https://dailybaileyai.com/home_page_files/banner_image.jpg",
    authors: [
      {
        name: "George Bailey",
        imageUrl: "https://dailybaileyai.com/images/avatars/my_profile.png",
        imageAlt: "George Bailey's headshot",
      },
    ],
    time: "3 minute read",
  },
  {
    title: "(a16z) Emerging Architectures for LLM Applications",
    description:
      "Large language models are a powerful new primitive for building software. But since they are so new—and behave so differently from normal computing resources—it's not always obvious how to use them.",
    badgeText: "External",
    date: "Jun 20, 2023",
    href: "https://a16z.com/2023/06/20/emerging-architectures-for-llm-applications",
    imageUrl:
      "https://i0.wp.com/a16z.com/wp-content/uploads/2023/06/2657-Emerging-LLM-App-Stack-R2-1-of-4-2.png?w=2000&ssl=1",
    authors: [
      {
        name: "Matt Bornstein",
        imageUrl:
          "https://a16z.com/wp-content/uploads/2019/07/MattBornstein-Investing-400x400.jpg",
        imageAlt: "Matt Bornstein's headshot",
      },
      {
        name: "Rajko Radovanovic",
        imageUrl:
          "https://a16z.com/wp-content/uploads/2023/05/Rajko-Radovanovic-400x400.png",
        imageAlt: "Rajko Radovanovic's headshot",
      },
    ],
    time: "5 minute read",
  },
  {
    title: "(Sequoia) The New Language Model Stack",
    description: "How companies are bringing AI applications to life",
    badgeText: "External",
    date: "Jun 14, 2023",
    href: "https://www.sequoiacap.com/article/llm-stack-perspective/",
    imageUrl:
      "https://www.sequoiacap.com/wp-content/uploads/sites/6/2023/06/llm-stack-hero-3.jpg",
    authors: [
      {
        name: "Michelle Fradin",
        imageUrl:
          "https://www.sequoiacap.com/wp-content/uploads/sites/6/2021/12/Michelle-Bailhe-profile-1.jpg?resize=880,880",
        imageAlt: "Michelle Fradin's headshot",
      },
      {
        name: "Lauren Reeder",
        imageUrl:
          "https://www.sequoiacap.com/wp-content/uploads/sites/6/2022/01/211118_clifford_sequoia-laurenreeder_DSF9377.jpg?resize=880,880",
        imageAlt: "Lauren Reeder's headshot",
      },
    ],
    time: "4 minute read",
  },
];

const Blog = async () => {
  return (
    <div className="w-full bg-[#f8feff] h-full antialiased relative text-black">
      <div className="relative w-full flex flex-col space-y-4 mx-auto max-w-5xl h-full py-16 items-center text-center px-2 sm:px-2 lg:px-0">
        <Image
          src={"/static/pricing/bouncing-cube.webp"}
          alt={"bouncing-cube"}
          width={200}
          height={100}
        />
        <h1 className="text-5xl font-bold text-gray-900 pt-4">
          The Helicone Blog
        </h1>
        <p className="text-lg text-gray-700">
          Thoughts about the future of AI - from the team helping to build it.
        </p>
        <div className="border-b border-gray-300 py-4 w-full flex items-center justify-center"></div>
        <div className="grid grid-cols-2 space-y-8">
          {blogContent.map((blog, i) => {
            if (i === 0) {
              return <FeaturedBlogPost blog={blog} key={i} />;
            } else {
              return <RegularBlogPost blog={blog} key={i} />;
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default Blog;
