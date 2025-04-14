import { clsx } from "@/components/shared/utils";
import Image from "next/image";
import Link from "next/link";
import { getMetadata } from "@/components/templates/blog/getMetaData";
import { Metadata } from "next";
import BlogFilter from "@/app/blog/BlogFilter";

export const metadata: Metadata = {
  title: "Helicone Blog | AI Development Insights & Best Practices",
  description:
    "Stay updated with the latest insights on AI development, LLM observability, and industry best practices from the team building the future of AI infrastructure.",
  icons: "/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/blog",
    title: "Helicone Blog | AI Development Insights & Best Practices",
    description:
      "Stay updated with the latest insights on AI development, LLM observability, and industry best practices from the team building the future of AI infrastructure.",
    images: "/static/new-open-graph.png",
    locale: "en_US",
  },
  twitter: {
    title: "Helicone Blog | AI Development Insights & Best Practices",
    description:
      "Stay updated with the latest insights on AI development, LLM observability, and industry best practices from the team building the future of AI infrastructure.",
    card: "summary_large_image",
    images: "/static/new-open-graph.png",
  },
};

type BlogPostProps = {
  blog: BlogStructure;
  dynamicMetadata?: Map<string, any>;
};

type UnPromise<T> = T extends Promise<infer U> ? U : T;

const HEADSHOTS = {
  "Cole Gottdank": "/static/blog/colegottdank-headshot.webp",
  "Lina Lam": "/static/blog/linalam-headshot.webp",
  "Stefan Bokarev": "/static/blog/stefanbokarev-headshot.webp",
  "Justin Torre": "/static/blog/justintorre-headshot.webp",
  "Scott Nguyen": "/static/blog/scottnguyen-headshot.webp",
  "Kavin Desi": "/static/blog/kavin-headshot.webp",
  "Yusuf Ishola": "/static/blog/yusuf-headshot.webp",
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
    badgeText: metadata.badge || "insight",
    date: metadata?.date ?? "",
    href: `/blog/${folderName}`,
    imageUrl: metadata?.images ?? "",
    time: metadata?.time ?? "",
  };
}

const RegularBlogPost: React.FC<BlogPostProps> = async ({
  blog,
  dynamicMetadata,
}) => {
  if ("dynmaicEntry" in blog) {
    const metadata = dynamicMetadata
      ? dynamicMetadata.get(blog.dynmaicEntry.folderName)
      : await getMetadata(blog.dynmaicEntry.folderName);
    blog = metaDataToBlogStructure(blog.dynmaicEntry.folderName, metadata);
  }

  return (
    <Link
      id="regular"
      className="flex flex-col gap-4 md:gap-6 p-2 md:p-4 w-full bg-white hover:bg-sky-50 border border-transparent hover:border-sky-100 rounded-xl pb-4 md:pb-6 transition-all duration-300"
      href={blog.href}
    >
      <div className="overflow-hidden rounded-xl relative group aspect-[16/9] w-full">
        <Image
          src={blog.imageUrl}
          alt={blog.imageAlt || blog.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
          className="rounded-xl object-cover transform group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="w-full h-fit flex flex-col space-y-2 text-left px-1 md:px-0">
        <h2 className="font-bold text-lg leading-snug tracking-tight line-clamp-2">
          {blog.title}
        </h2>
        <p className="text-slate-500 text-sm line-clamp-2 md:line-clamp-3">
          {blog.description}
        </p>
        <div className="flex items-center gap-2 text-slate-500 text-sm pt-2">
          <span>
            {blog.badgeText.charAt(0).toUpperCase() + blog.badgeText.slice(1)}
          </span>
          <span>•</span>
          <span>{blog.date}</span>
        </div>
      </div>
    </Link>
  );
};

const FeaturedBlogPost: React.FC<BlogPostProps> = async ({
  blog,
  dynamicMetadata,
}) => {
  if ("dynmaicEntry" in blog) {
    const metadata = dynamicMetadata
      ? dynamicMetadata.get(blog.dynmaicEntry.folderName)
      : await getMetadata(blog.dynmaicEntry.folderName);
    blog = metaDataToBlogStructure(blog.dynmaicEntry.folderName, metadata);
  }

  return (
    <Link
      id="featured"
      className="flex flex-col md:flex-row items-start gap-4 md:gap-8 w-full bg-white md:bg-sky-50 hover:bg-sky-50 md:hover:bg-sky-100 rounded-xl p-2 md:p-6 border border-transparent md:border-sky-100 transition-all duration-300 mb-4 md:mb-6"
      href={blog.href}
    >
      <div className="w-full md:w-1/2 overflow-hidden rounded-xl order-1 group aspect-[16/9] md:h-72 relative">
        <Image
          src={blog.imageUrl}
          alt={blog.imageAlt || blog.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={true}
          style={{ objectFit: "cover" }}
          className="rounded-lg transform group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="w-full md:w-1/2 h-full rounded-lg flex flex-col space-y-2 md:space-y-4 text-left order-2 md:mt-4 px-1 md:px-6">
        <div className="hidden md:flex items-center">
          <span className="bg-sky-200 text-sky-700 w-max items-center rounded-full px-3 py-1 text-sm font-medium">
            {blog.badgeText.charAt(0).toUpperCase() + blog.badgeText.slice(1)}
          </span>
        </div>

        <h2 className="font-bold text-lg md:text-3xl leading-snug md:leading-tight tracking-tight line-clamp-2">
          {blog.title}
        </h2>
        <p className="text-slate-500 md:text-slate-600 text-sm md:text-base line-clamp-2 md:line-clamp-2">
          {blog.description}
        </p>

        <div className="flex md:hidden items-center gap-2 text-slate-500 text-sm pt-2">
          <span>
            {blog.badgeText.charAt(0).toUpperCase() + blog.badgeText.slice(1)}
          </span>
          <span>•</span>
          <span>{blog.date}</span>
        </div>

        <div className="hidden md:flex md:flex-row md:justify-between md:gap-4 md:items-center md:py-4">
          <div className="flex flex-wrap gap-2">
            {blog.authors.map((author, i) => (
              <div className="flex items-center space-x-2" key={i}>
                <img
                  className="inline-block h-8 w-8 rounded-full"
                  src={author.imageUrl}
                  alt={author.imageAlt || ""}
                />
                <span className="text-slate-500 text-sm">{author.name}</span>
              </div>
            ))}
          </div>
          <span className="text-slate-400 text-sm">{blog.date}</span>
        </div>
      </div>
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
      folderName: "buy-vs-build-llm-observability",
    },
  },
  {
    dynmaicEntry: {
      folderName: "full-guide-to-improving-ai-agents",
    },
  },
  {
    dynmaicEntry: {
      folderName: "agentic-rag-full-developer-guide",
    },
  },
  {
    dynmaicEntry: {
      folderName: "openai-realtime-api-with-helicone",
    },
  },
  {
    dynmaicEntry: {
      folderName: "gemini-2.5-full-developer-guide",
    },
  },
  {
    dynmaicEntry: {
      folderName: "o1-pro-for-developers",
    },
  },
  {
    dynmaicEntry: {
      folderName: "how-to-reduce-llm-hallucination",
    },
  },
  {
    dynmaicEntry: {
      folderName: "mcp-full-developer-guide",
    },
  },
  {
    dynmaicEntry: {
      folderName: "manus-benchmark-operator-comparison",
    },
  },
  {
    dynmaicEntry: {
      folderName: "browser-use-vs-computer-use-vs-operator",
    },
  },
  {
    dynmaicEntry: {
      folderName: "chain-of-draft",
    },
  },
  {
    dynmaicEntry: {
      folderName: "evaluating-claude-code",
    },
  },
  {
    dynmaicEntry: {
      folderName: "gpt-4.5-benchmarks",
    },
  },
  {
    dynmaicEntry: {
      folderName: "claude-3.7-benchmarks-and-examples",
    },
  },
  {
    dynmaicEntry: {
      folderName: "grok-3-benchmark-comparison",
    },
  },
  {
    dynmaicEntry: {
      folderName: "openai-deep-research",
    },
  },
  {
    dynmaicEntry: {
      folderName: "introducing-helicone-v2",
    },
  },
  {
    dynmaicEntry: {
      folderName: "deepseek-janus-pro",
    },
  },
  {
    dynmaicEntry: {
      folderName: "switch-to-deepseek",
    },
  },
  {
    dynmaicEntry: {
      folderName: "prompt-thinking-models",
    },
  },
  {
    dynmaicEntry: {
      folderName: "open-webui-alternatives",
    },
  },
  {
    dynmaicEntry: {
      folderName: "llm-api-providers",
    },
  },
  {
    dynmaicEntry: {
      folderName: "effective-llm-caching",
    },
  },
  {
    dynmaicEntry: {
      folderName: "preventing-prompt-injection",
    },
  },
  {
    dynmaicEntry: {
      folderName: "deepseek-v3",
    },
  },
  {
    dynmaicEntry: {
      folderName: "prompt-evaluation-frameworks",
    },
  },
  {
    dynmaicEntry: {
      folderName: "openai-o3",
    },
  },
  {
    dynmaicEntry: {
      folderName: "gpt-4o-mini-vs-claude-3.5-sonnet",
    },
  },
  {
    dynmaicEntry: {
      folderName: "tree-of-thought-prompting",
    },
  },
  {
    dynmaicEntry: {
      folderName: "openai-structured-outputs",
    },
  },
  {
    dynmaicEntry: {
      folderName: "helicone-vs-traceloop",
    },
  },
  {
    dynmaicEntry: {
      folderName: "helicone-vs-comet",
    },
  },
  {
    dynmaicEntry: {
      folderName: "helicone-vs-honeyhive",
    },
  },
  {
    dynmaicEntry: {
      folderName: "text-classification-with-llms",
    },
  },
  {
    dynmaicEntry: {
      folderName: "chain-of-thought-prompting",
    },
  },
  {
    dynmaicEntry: {
      folderName: "rag-chunking-strategies",
    },
  },
  {
    dynmaicEntry: {
      folderName: "gemini-2.0-flash",
    },
  },
  {
    dynmaicEntry: {
      folderName: "crewai-vs-dify-ai",
    },
  },
  {
    dynmaicEntry: {
      folderName: "claude-3.5-sonnet-vs-openai-o1",
    },
  },
  {
    dynmaicEntry: {
      folderName: "google-gemini-exp-1206",
    },
  },
  {
    dynmaicEntry: {
      folderName: "meta-llama-3-3-70-b-instruct",
    },
  },
  {
    dynmaicEntry: {
      folderName: "openai-o1-and-chatgpt-pro",
    },
  },
  {
    dynmaicEntry: {
      folderName: "openai-gpt-5",
    },
  },
  {
    dynmaicEntry: {
      folderName: "test-your-llm-prompts",
    },
  },
  {
    dynmaicEntry: {
      folderName: "prompt-evaluation-for-llms",
    },
  },
  {
    dynmaicEntry: {
      folderName: "crewai-vs-autogen",
    },
  },
  {
    dynmaicEntry: {
      folderName: "pdf-chatbot-tutorial",
    },
  },
  {
    dynmaicEntry: {
      folderName: "llamaindex-vs-langchain",
    },
  },
  {
    dynmaicEntry: {
      folderName: "when-to-finetune",
    },
  },
  {
    dynmaicEntry: {
      folderName: "debugging-chatbots-and-ai-agents-with-sessions",
    },
  },
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
      folderName: "monitor-and-optimize-llm-costs",
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
    dynmaicEntry: {
      folderName: "prompt-management",
    },
  },
  {
    dynmaicEntry: {
      folderName: "sam-2",
    },
  },
  {
    dynmaicEntry: {
      folderName: "implementing-llm-observability-with-helicone",
    },
  },
  {
    dynmaicEntry: {
      folderName: "llm-observability",
    },
  },
  {
    dynmaicEntry: {
      folderName: "best-langsmith-alternatives",
    },
  },
  {
    title:
      "Handling Billions of LLM Logs with Upstash Kafka and Cloudflare Workers",
    description:
      "We desperately needed a solution to these outages/data loss. Our reliability and scalability are core to our product.",
    badgeText: "Company",
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
    dynmaicEntry: {
      folderName: "ai-best-practices",
    },
  },
  {
    dynmaicEntry: {
      folderName: "first-ai-app-with-helicone",
    },
  },
  {
    dynmaicEntry: {
      folderName: "custom-properties",
    },
  },
  {
    dynmaicEntry: {
      folderName: "weights-and-biases",
    },
  },
  {
    dynmaicEntry: {
      folderName: "cole-github-copilot",
    },
  },
  {
    dynmaicEntry: {
      folderName: "stefan-posthog",
    },
  },
  {
    dynmaicEntry: {
      folderName: "switch-models-safely",
    },
  },
  {
    dynmaicEntry: {
      folderName: "best-datadog-alternative-for-llm",
    },
  },
  {
    dynmaicEntry: {
      folderName: "langsmith-vs-helicone",
    },
  },
  {
    dynmaicEntry: {
      folderName: "ai-safety",
    },
  },
  {
    dynmaicEntry: {
      folderName: "vault-introduction",
    },
  },
  {
    dynmaicEntry: {
      folderName: "life-after-yc",
    },
  },
  {
    dynmaicEntry: {
      folderName: "open-source-monitoring-for-openai",
    },
  },
  {
    dynmaicEntry: {
      folderName: "autoGPT",
    },
  },
  {
    title: "Generative AI with Helicone",
    description:
      "In the rapidly evolving world of generative AI, companies face the exciting challenge of building innovative solutions while effectively managing costs, result quality, and latency. Enter Helicone, an open-source observability platform specifically designed for these cutting-edge endeavors.",
    badgeText: "Company",
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
    badgeText: "Company",
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
    badgeText: "Company",
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

export default async function Blog({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  // Get filter values from URL
  const activeFilter = (searchParams.category || "all").toLowerCase();
  const searchTerm = (searchParams.q || "").toLowerCase();

  // Load metadata for all dynamic entries first
  const dynamicMetadata = new Map();

  for (const blog of blogContent) {
    if ("dynmaicEntry" in blog) {
      const metadata = await getMetadata(blog.dynmaicEntry.folderName);
      dynamicMetadata.set(blog.dynmaicEntry.folderName, metadata);
    }
  }

  // Extract unique badge values from blog content
  const allBadges = Array.from(
    new Set(
      blogContent.map((blog) => {
        if ("dynmaicEntry" in blog) {
          const metadata = dynamicMetadata.get(blog.dynmaicEntry.folderName);
          return (metadata?.badge || "insight").toLowerCase();
        }
        return blog.badgeText.toLowerCase();
      })
    )
  );

  // Always keep featured post visible
  const featuredPost = blogContent[0];

  // Filter the remaining posts based on URL parameters
  const filteredPosts = blogContent.slice(1).filter((blog) => {
    let badgeText = "";
    let title = "";

    if ("dynmaicEntry" in blog) {
      const metadata = dynamicMetadata.get(blog.dynmaicEntry.folderName);
      badgeText = (metadata?.badge || "insight").toLowerCase();
      title = metadata?.title || "";
    } else {
      badgeText = blog.badgeText.toLowerCase();
      title = blog.title;
    }

    // Apply filters
    const matchesCategory =
      activeFilter === "all" || badgeText === activeFilter;
    const matchesSearch =
      !searchTerm || title.toLowerCase().includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full bg-gradient-to-b bg-white min-h-screen antialiased relative text-black">
      <div className="relative w-full flex flex-col mx-auto max-w-7xl h-full py-8 md:py-12 items-center text-center px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
          {/* Featured blog post */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 w-full">
            <FeaturedBlogPost
              blog={featuredPost}
              dynamicMetadata={dynamicMetadata}
            />
          </div>

          {/* Filter component */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 w-full mb-4">
            <BlogFilter badges={allBadges} />
          </div>

          {/* Filtered blog posts */}
          {filteredPosts.length > 0 ? (
            filteredPosts.map((blog, i) => (
              <RegularBlogPost
                blog={blog}
                dynamicMetadata={dynamicMetadata}
                key={i}
              />
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-8">
              <p className="text-slate-500">
                No matching blog posts found. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
