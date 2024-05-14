import MetaData from "../../components/layout/public/authMetaData";
import BlogPage from "../../components/templates/blog/blogPage";

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
    title: "A step by step guide to switch to gpt-4o safely with Helicone",
    description:
      "Learn how to use Helicone's experiments features to regression test, compare and switch models.",
    badgeText: "Product",
    date: "May 14, 2024",
    href: "/blog/switch-models-safely",
    imageUrl: "assets/blog/experiments/gpt-4o.png",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/assets/blog/scottnguyen-headshot.webp",
      },
    ],
    time: "5 minute read",
  },
  {
    title: "A Guide for Datadog Users Building with LLM's",
    description:
      "Datadog has long been a favourite among developers for monitoring and observability. But recently, LLM developers have been exploring new options. Why? We have some answers.",
    badgeText: "Compare",
    date: "Apr 29, 2024",
    href: "/blog/datadog",
    imageUrl: "assets/blog/datadog/title.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/assets/blog/linalam-headshot.webp",
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
    imageUrl: "assets/blog/langsmith-vs-helicone/cover-image.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/assets/blog/linalam-headshot.webp",
      },
    ],
    time: "4 minute read",
  },
  {
    title:
      "Why Observability is the key to ethical and safe Artificial Intelligence",
    description:
      "As AI continues to shape our world, the need for ethical practices and robust observability has never been greater. Learn how Helicone is rising to the challenge.",
    badgeText: "AI Safety",
    date: "Sep 18, 2023",
    href: "/blog/ai-safety",
    imageUrl: "/assets/blog/AI.webp",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/assets/blog/scottnguyen-headshot.webp",
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
    href: "/blog/vault",
    imageUrl: "/assets/blog/vault_asset.png",
    authors: [
      {
        name: "Cole Gottdank",
        imageUrl: "/assets/blog/colegottdank-headshot.png",
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
    imageUrl: "/assets/blog/yc.webp",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/assets/blog/scottnguyen-headshot.webp",
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
    imageUrl: "/assets/blog/openai.webp",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/assets/blog/scottnguyen-headshot.webp",
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
    imageUrl: "/assets/autoGPTLogo.png",
    authors: [
      {
        name: "Justin Torre",
        imageUrl:
          "https://media.licdn.com/dms/image/D5603AQG1fVqLULxCYA/profile-displayphoto-shrink_800_800/0/1673810039348?e=1696464000&v=beta&t=UTxO3PbbnF8bLmP2CosOwCnmh5yxyOJYAIG2XmV8uAM",
      },
    ],
    time: "1 minute read",
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
      },
    ],
    time: "3 minute read",
  },
  {
    title: "(a16z) Emerging Architectures for LLM Applications",
    description:
      "Large language models are a powerful new primitive for building software. But since they are so new—and behave so differently from normal computing resources—it’s not always obvious how to use them.",
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
      },
      {
        name: "Rajko Radovanovic",
        imageUrl:
          "https://a16z.com/wp-content/uploads/2023/05/Rajko-Radovanovic-400x400.png",
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
    time: "4 minute read",
  },
];

const Blog = () => {
  return (
    <MetaData title="Blog">
      <BlogPage content={blogContent} />
    </MetaData>
  );
};

export default Blog;
