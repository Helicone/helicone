/* eslint-disable @next/next/no-img-element */
const featuredPost = {
  title: "Helicone Partners with AutoGPT",
  href: "/blog/autoGPT",
  description:
    "Helicone is excited to announce a partnership with AutoGPT, the leader in agent development.",
  date: "Jul 30, 2023",
  datetime: "2023-07-30",
  imageUrl: "/assets/autoGPTLogo.png",

  authors: [
    {
      name: "Justin Torre",
      href: "https://www.linkedin.com/in/justintorre/",
      imageUrl:
        "https://media.licdn.com/dms/image/D5603AQG1fVqLULxCYA/profile-displayphoto-shrink_800_800/0/1673810039348?e=1696464000&v=beta&t=UTxO3PbbnF8bLmP2CosOwCnmh5yxyOJYAIG2XmV8uAM",
    },
  ],
  tag: undefined,
};

const posts = [
  {
    title: "Generative AI with Helicone",
    href: "https://dailybaileyai.com/software/helicone.php",
    description:
      "In the rapidly evolving world of generative AI, companies face the exciting challenge of building innovative solutions while effectively managing costs, result quality, and latency. Enter Helicone, an open-source observability platform specifically designed for these cutting-edge endeavors. With just one line of code, companies gain access to a powerful tool that allows them to log requests made to providers like OpenAI, thereby gaining deep insights into their AI systems' performance and resource usage.",
    date: "Jul 21, 2023",
    datetime: "2023-07-21",
    imageUrl: "https://dailybaileyai.com/home_page_files/banner_image.jpg",
    authors: [
      {
        name: "George Bailey",
        href: "https://dailybaileyai.com/index.php",
        imageUrl: "https://dailybaileyai.com/images/avatars/my_profile.png",
      },
    ],
    tag: "External",
  },
  {
    title: "(a16z) Emerging Architectures for LLM Applications",
    href: "https://a16z.com/2023/06/20/emerging-architectures-for-llm-applications",
    description:
      "Large language models are a powerful new primitive for building software. But since they are so new—and behave so differently from normal computing resources—it’s not always obvious how to use them.",
    date: "Jun 20, 2023",
    datetime: "2023-06-20",
    imageUrl:
      "https://i0.wp.com/a16z.com/wp-content/uploads/2023/06/2657-Emerging-LLM-App-Stack-R2-1-of-4-2.png?w=2000&ssl=1",

    authors: [
      {
        name: "Matt Bornstein",
        href: "https://a16z.com/author/matt-bornstein/",
        imageUrl:
          "https://a16z.com/wp-content/uploads/2019/07/MattBornstein-Investing-400x400.jpg",
      },
      {
        name: "Rajko Radovanovic",
        href: "https://a16z.com/author/rajko-radovanovic/",
        imageUrl:
          "https://a16z.com/wp-content/uploads/2023/05/Rajko-Radovanovic-400x400.png",
      },
    ],
    tag: "External",
  },
  {
    title: "(Sequoia) The New Language Model Stack",
    href: "https://www.sequoiacap.com/article/llm-stack-perspective/",
    description: "How companies are bringing AI applications to life",
    date: "Jun 14, 2023",
    datetime: "2023-06-14",
    imageUrl:
      "https://www.sequoiacap.com/wp-content/uploads/sites/6/2023/06/llm-landscape-10.png?resize=1536,1333",

    authors: [
      {
        name: "Michelle Fradin",
        href: "https://www.sequoiacap.com/people/michelle-fradin/",
        imageUrl:
          "https://www.sequoiacap.com/wp-content/uploads/sites/6/2021/12/Michelle-Bailhe-profile-1.jpg?resize=880,880",
      },
      {
        name: "Lauren Reeder",
        href: "https://www.sequoiacap.com/people/lauren-reeder/",
        imageUrl:
          "https://www.sequoiacap.com/wp-content/uploads/sites/6/2022/01/211118_clifford_sequoia-laurenreeder_DSF9377.jpg?resize=880,880",
      },
    ],
    tag: "External",
  },
];

export default function BlogPage() {
  return (
    <div className="bg-white py-24 sm:py-32 min-h-[80vh]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-12 px-6 sm:gap-y-16 lg:grid-cols-2 lg:px-8">
        <article className="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-lg">
          <div className="relative w-full">
            <a href={featuredPost.href}>
              <img
                src={featuredPost.imageUrl}
                alt=""
                className="aspect-[16/9] w-full rounded-2xl bg-gray-100 object-cover sm:aspect-[2/1] lg:aspect-[2/1]"
              />
            </a>
          </div>
          <div className="flex flex-row gap-2 pt-8">
            <time
              dateTime={featuredPost.datetime}
              className="block text-sm leading-6 text-gray-600"
            >
              {featuredPost.date}
            </time>
            {featuredPost.tag && (
              <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-700/10">
                {featuredPost.tag}
              </span>
            )}
          </div>
          <h2
            id="featured-post"
            className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            <a href={featuredPost.href}>{featuredPost.title}</a>
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            {featuredPost.description}
          </p>
          <div className="mt-4 flex flex-col justify-between gap-6 sm:mt-8 sm:flex-row-reverse sm:gap-8 lg:mt-4 lg:flex-col">
            <div className="flex">
              <a
                href={featuredPost.href}
                className="text-sm font-semibold leading-6 text-sky-600"
                aria-describedby="featured-post"
              >
                Continue reading <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
            {featuredPost.authors.map((author, i) => (
              <div
                className="flex lg:border-t lg:border-gray-900/10 lg:pt-8"
                key={i}
              >
                <a
                  href={author.href}
                  className="flex gap-x-2.5 text-sm font-semibold leading-6 text-gray-900"
                >
                  <img
                    src={author.imageUrl}
                    alt=""
                    className="h-6 w-6 flex-none rounded-full bg-gray-50"
                  />
                  {author.name}
                </a>
              </div>
            ))}
          </div>
        </article>
        <div className="mx-auto w-full max-w-2xl border-t border-gray-900/10 pt-12 sm:pt-16 lg:mx-0 lg:max-w-none lg:border-t-0 lg:pt-0">
          <div className="-my-12 divide-y divide-gray-900/10">
            {posts.map((post, id) => (
              <article key={id} className="py-12">
                <div className="relative w-full">
                  <a href={post.href}>
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="aspect-[16/9] w-full rounded-2xl bg-gray-100 object-cover sm:aspect-[8/3] lg:aspect-[8/3]"
                    />
                  </a>
                </div>
                <div className="group relative max-w-xl pt-8">
                  <div className="flex flex-row gap-2">
                    <time
                      dateTime={post.datetime}
                      className="block text-sm leading-6 text-gray-600"
                    >
                      {post.date}
                    </time>
                    <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-700/10">
                      {post.tag}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-gray-600">
                    <a href={`${post.href}`}>
                      <span className="absolute inset-0" />
                      {post.title}
                    </a>
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-gray-600">
                    {post.description}
                  </p>
                </div>
                <div className="flex flex-row space-x-2">
                  {post.authors.map((author, i) => (
                    <div
                      className="flex lg:border-t lg:border-gray-900/10 lg:pt-8"
                      key={i}
                    >
                      <a
                        href={author.href}
                        className="relative flex gap-x-2.5 text-sm font-semibold leading-6 text-gray-900"
                      >
                        <img
                          src={author.imageUrl}
                          alt=""
                          className="h-6 w-6 flex-none rounded-full bg-gray-50"
                        />
                        {author.name}
                      </a>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
