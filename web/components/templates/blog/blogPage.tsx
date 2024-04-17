import Link from "next/link";
import { clsx } from "../../shared/clsx";
import Image from "next/image";

interface BlogPageProps {}

type blogStructure = {
  title: string;
  description: string;
  badgeText: string;
  badgeColor: string;
  date: string;
  href: string;
  imageUrl: string;
  authors: {
    name: string;
    imageUrl: string;
  }[];
};

const blogContent: blogStructure[] = [
  {
    title: "Langsmith v Helicone",
    description:
      "As AI continues to shape our world, the need for ethical practices and robust observability has never been greater. Learn how Helicone is rising to the challenge.",
    badgeText: "AI Safety",
    badgeColor: "bg-red-50 text-red-700 ring-red-600/10",
    date: "Sep 18, 2023",
    href: "/blog/hello",
    imageUrl: "/assets/blog/AI.webp",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/assets/blog/scottnguyen-headshot.webp",
      },
    ],
  },
  {
    title:
      "Why Observability is the key to ethical and safe Artificial Intelligence",
    description:
      "As AI continues to shape our world, the need for ethical practices and robust observability has never been greater. Learn how Helicone is rising to the challenge.",
    badgeText: "AI Safety",
    badgeColor: "bg-red-50 text-red-700 ring-red-600/10",
    date: "Sep 18, 2023",
    href: "/blog/ai-safety",
    imageUrl: "/assets/blog/AI.webp",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/assets/blog/scottnguyen-headshot.webp",
      },
    ],
  },
  {
    title:
      "Introducing Vault: The Future of Secure and Simplified Provider API Key Management",
    description:
      "Helicone's Vault revolutionizes the way businesses handle, distribute, and monitor their provider API keys, with a focus on simplicity, security, and flexibility.",
    badgeText: "Product",
    badgeColor: "bg-blue-50 text-blue-700 ring-blue-600/10",
    date: "Sep 13, 2023",
    href: "/blog/vault",
    imageUrl: "/assets/blog/vault_asset.png",
    authors: [
      {
        name: "Cole Gottdank",
        imageUrl: "/assets/blog/colegottdank-headshot.png",
      },
    ],
  },
  {
    title: "Life after Y Combinator: Three Key Lessons for Startups",
    description:
      "From maintaining crucial relationships to keeping a razor-sharp focus, here's how to sustain your momentum after the YC batch ends.",
    badgeText: "Personal",
    badgeColor: "bg-orange-50 text-orange-700 ring-orange-600/10",
    date: "Sep 11, 2023",
    href: "/blog/life-after-yc",
    imageUrl: "/assets/blog/yc.webp",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/assets/blog/scottnguyen-headshot.webp",
      },
    ],
  },
  {
    title: "Helicone: The Next Evolution in OpenAI Monitoring and Optimization",
    description:
      "Learn how Helicone provides unmatched insights into your OpenAI usage, allowing you to monitor, optimize, and take control like never before.",
    badgeText: "Education",
    badgeColor: "bg-sky-50 text-sky-700 ring-sky-600/10",
    date: "Sep 1, 2023",
    href: "/blog/open-source-monitoring-for-openai",
    imageUrl: "/assets/blog/openai.webp",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/assets/blog/scottnguyen-headshot.webp",
      },
    ],
  },
  {
    title: "Helicone partners with AutoGPT",
    description:
      "Helicone is excited to announce a partnership with AutoGPT, the leader in agent development.",
    badgeText: "Partnership",
    badgeColor: "bg-pink-50 text-pink-700 ring-pink-600/10",
    date: "Jul 30, 2023",
    href: "/blog/autoGPT",
    imageUrl: "/assets/autoGPTLogo.png",
    authors: [
      {
        name: "Justin Torre",
        imageUrl:
          "https://media.licdn.com/dms/image/D5603AQG1fVqLULxCYA/profile-displayphoto-shrink_800_800/0/1673810039348?e=1696464000&v=beta&t=UTxO3PbbnF8bLmP2CosOwCnmh5yxyOJYAIG2XmV8uAM",
      },
    ],
  },
  {
    title: "Generative AI with Helicone",
    description:
      "In the rapidly evolving world of generative AI, companies face the exciting challenge of building innovative solutions while effectively managing costs, result quality, and latency. Enter Helicone, an open-source observability platform specifically designed for these cutting-edge endeavors.",
    badgeText: "External",
    badgeColor: "bg-violet-50 text-violet-700 ring-violet-600/10",
    date: "Jul 21, 2023",
    href: "https://dailybaileyai.com/software/helicone.php",
    imageUrl: "https://dailybaileyai.com/home_page_files/banner_image.jpg",
    authors: [
      {
        name: "George Bailey",
        imageUrl: "https://dailybaileyai.com/images/avatars/my_profile.png",
      },
    ],
  },
  {
    title: "(a16z) Emerging Architectures for LLM Applications",
    description:
      "Large language models are a powerful new primitive for building software. But since they are so new—and behave so differently from normal computing resources—it’s not always obvious how to use them.",
    badgeText: "External",
    badgeColor: "bg-violet-50 text-violet-700 ring-violet-600/10",
    date: "Jun 20, 2023",
    href: "https://a16z.com/2023/06/20/emerging-architectures-for-llm-applications",
    imageUrl:
      "https://i0.wp.com/a16z.com/wp-content/uploads/2023/06/2657-Emerging-LLM-App-Stack-R2-1-of-4-2.png?w=2000&ssl=1",
    authors: [
      {
        name: "Matt Bornstein",
        imageUrl:
          "https://a16z.com/wp-content/uploads/2019/07/MattBornstein-Investing-400x400.jpg",
      },
      {
        name: "Rajko Radovanovic",
        imageUrl:
          "https://a16z.com/wp-content/uploads/2023/05/Rajko-Radovanovic-400x400.png",
      },
    ],
  },
  {
    title: "(Sequoia) The New Language Model Stack",
    description: "How companies are bringing AI applications to life",
    badgeText: "External",
    badgeColor: "bg-violet-50 text-violet-700 ring-violet-600/10",
    date: "Jun 14, 2023",
    href: "https://www.sequoiacap.com/article/llm-stack-perspective/",
    imageUrl:
      "https://www.sequoiacap.com/wp-content/uploads/sites/6/2023/06/llm-landscape-10.png?resize=1536,1333",
    authors: [
      {
        name: "Michelle Fradin",
        imageUrl:
          "https://www.sequoiacap.com/wp-content/uploads/sites/6/2021/12/Michelle-Bailhe-profile-1.jpg?resize=880,880",
      },
      {
        name: "Lauren Reeder",
        imageUrl:
          "https://www.sequoiacap.com/wp-content/uploads/sites/6/2022/01/211118_clifford_sequoia-laurenreeder_DSF9377.jpg?resize=880,880",
      },
    ],
  },
];

const BlogPage = (props: BlogPageProps) => {
  const {} = props;

  return (
    <div className="bg-gray-50">
      <div className="flex flex-col mx-auto max-w-7xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiased">
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          The latest{" "}
          <span className="bg-gradient-to-r from-sky-500 via-pink-500 to-violet-500 bg-[length:100%_4px] pb-1 bg-no-repeat bg-bottom">
            news
          </span>
        </h1>
        <p className="mt-6 w-full text-xl leading-8 text-gray-700 max-w-2xl">
          Stay up to date with the latest news and articles about Helicone and
          learn about how we are helping build the future of AI.
        </p>
        <div className="border-b border-gray-200 mt-12" />
        <section className="mt-16 flex flex-col space-y-24">
          {blogContent.map((blog, idx) => (
            <Link
              key={idx}
              href={blog.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex flex-col sm:flex-row gap-8 h-full sm:h-80 hover:bg-gray-100 hover:cursor-pointer rounded-xl p-4"
            >
              <div className="w-full sm:w-2/5 rounded-xl h-full bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl">
                <img
                  src={blog.imageUrl}
                  alt="App screenshot"
                  style={{
                    objectFit: "cover",
                  }}
                  className="w-full h-full rounded-lg shadow-sm ring-1 ring-gray-900/10"
                />
              </div>
              <div className="w-full sm:w-3/5 flex flex-col justify-between py-4">
                <div className="flex flex-col space-y-4">
                  <span
                    className={clsx(
                      blog.badgeColor,
                      "w-fit inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset"
                    )}
                  >
                    {blog.badgeText}
                  </span>
                  <h2 className="font-semibold text-3xl">{blog.title}</h2>
                  <p className="text-gray-700">{blog.description}</p>
                </div>
                <div className="flex flex-row divide-x divide-gray-200 gap-4 items-center">
                  {blog.authors.map((author, i) => (
                    <div
                      className={clsx(
                        "flex items-center space-x-3 bottom-0",
                        i !== 0 && "pl-4"
                      )}
                      key={i}
                    >
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

                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 pl-4">
                    <time>{blog.date}</time>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
};

export default BlogPage;
