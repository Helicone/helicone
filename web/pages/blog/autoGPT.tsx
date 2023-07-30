/* eslint-disable @next/next/no-img-element */
import {
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Footer from "../../components/shared/layout/footer";
import NavBarV2 from "../../components/shared/layout/navBarV2";
import MetaData from "../../components/shared/metaData";

interface ExampleBlogProps {}

const ExampleBlog = (props: ExampleBlogProps) => {
  const {} = props;

  return (
    <MetaData title="AutoGPT x Helicone: Optimizing Evaluation Pipelines">
      <NavBarV2 />
      <section>
        <div className="bg-white px-6 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl text-base leading-7 text-gray-700">
            <img
              className="h-full w-auto"
              src="/assets/autoGPTxHelicone.png"
              alt="Workflow"
            />
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              AutoGPT {"<>"} Helicone
            </h1>
            <p className="mt-6 text-xl leading-8">
              Building the Best Evaluation Pipeline for Agents Comparison
            </p>
            <div className="mt-10 max-w-2xl">
              <p>
                AutoGPT is hard at work on their Auto-GPT-Benchmarks repository.
                Their goal? To construct the best evaluation pipeline for
                comparing different agents. AutoGPT is fully leveraging the
                power of Helicone without changing a single line of code. Here
                are the key features driving this synergy:
              </p>
              <ul role="list" className="mt-8 max-w-xl space-y-8 text-gray-600">
                <li className="flex gap-x-3">
                  <CheckCircleIcon
                    className="mt-1 h-5 w-5 flex-none text-indigo-600"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="font-semibold text-gray-900">
                      Proxy Integration:
                    </strong>{" "}
                    Helicone's role as a proxy enables AutoGPT to maintain their
                    codebase untouched.
                  </span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon
                    className="mt-1 h-5 w-5 flex-none text-indigo-600"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="font-semibold text-gray-900">
                      Caching:
                    </strong>{" "}
                    For minor code changes that don't require re-calling the LLM
                    for an entire CI pipeline, requests can be cached on edge
                    servers. This feature saves AutoGPT over $10 per PR!
                  </span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon
                    className="mt-1 h-5 w-5 flex-none text-indigo-600"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="font-semibold text-gray-900">
                      GraphQL:
                    </strong>{" "}
                    Our data extraction API allows AutoGPT to create custom
                    reports upon the completion of a CI job.
                  </span>
                </li>
              </ul>
              <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
                AutoGPT's Integration Journey
              </h2>
              <p className="mt-6">
                AutoGPT embarked on their integration journey with Helicone by
                using the MITM tools that allow them to intercept all the
                traffic going to OpenAI on their CI machine and reroute it to
                Helicone. This strategic move allows AutoGPT to leverage all of
                Helicone's features. The integration, facilitated by a
                Man-In-The-Middle (MITM), captures all logs that would be sent
                to OpenAI.
              </p>
              <pre className="mt-8 p-6 rounded-md bg-gray-100 text-gray-700">
                {`bash -c "$(curl -fsSL https://raw.githubusercontent.com/Helicone/helicone/main/mitmproxy.sh)" -s start`}
              </pre>
              <p className="mt-6">
                Within the benchmarks, there's a python library where specific
                custom properties can be configured, filtered, and measured like
                this:
              </p>
              <pre className="mt-8 p-6 rounded-md bg-gray-100 text-gray-700">
                {`HeliconeLockManager.write_custom_property("job_id", "1")
HeliconeLockManager.write_custom_property("agent", "smol-developer")`}
              </pre>
              <p className="mt-6">
                To enable caching, they simply set an environment variable like
                this:
              </p>
              <pre className="mt-8 p-6 rounded-md bg-gray-100 text-gray-700">
                {`export HELICONE_CACHE_ENABLED="true"`}
              </pre>
              <span>
                Ideal for minor code changes where a full LLM call isn't
                required for an entire CI pipeline, AutoGPT can cache their
                requests on Helicone's edge servers. This strategic move saves
                them over 10 dollars per pull request!
              </span>

              <li className="flex gap-x-3">
                <CheckCircleIcon
                  className="mt-1 h-5 w-5 flex-none text-indigo-600"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-semibold text-gray-900">
                    GraphQL:
                  </strong>{" "}
                  Helicone's API for data extraction provides AutoGPT with the
                  ability to construct custom reports in their CI once a job is
                  complete.
                </span>
              </li>
            </div>
            <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
              AutoGPT's Workflow with Helicone
            </h2>
            <p className="mt-6">
              AutoGPT's workflow took advantage of Helicone's Man-In-The-Middle
              (MITM) tools. This facilitated the interception of all traffic
              that would have been directed to OpenAI from their CI machine and
              rerouted it to Helicone. Consequently, AutoGPT can now leverage
              all of Helicone's features.
            </p>
            <h3 className="mt-10 text-xl font-bold tracking-tight text-gray-900">
              Integration
            </h3>
            <p className="mt-6">
              AutoGPT used a MITM approach to capture all logs intended for
              OpenAI. Here is a code snippet showcasing how this was done:
            </p>
            <pre className="mt-6 p-4 bg-gray-800 text-white rounded-md">
              <code>{`bash -c "$(curl -fsSL https://raw.githubusercontent.com/Helicone/helicone/main/mitmproxy.sh)" -s start`}</code>
            </pre>
            <p className="mt-6">
              Within the benchmarks, AutoGPT implemented a Python library where
              they could set specific custom properties for detailed
              measurements, as shown here:
            </p>
            <pre className="mt-6 p-4 bg-gray-800 text-white rounded-md">
              <code>{`HeliconeLockManager.write_custom_property("job_id", "1")
HeliconeLockManager.write_custom_property("agent", "smol-developer")`}</code>
            </pre>
            <p className="mt-6">
              If AutoGPT wants to enable caching, they can do so by simply
              setting an environment variable like this:
            </p>
            <pre className="mt-6 p-4 bg-gray-800 text-white rounded-md">
              <code>{`export HELICONE_CACHE_ENABLED="true"`}</code>
            </pre>
            <p className="mt-6">
              The total integration process required at most 5 lines of code,
              which enabled AutoGPT to immediately get rich dashboards and save
              costs on their CI jobs.
            </p>
            <h3 className="mt-10 text-xl font-bold tracking-tight text-gray-900">
              Data Ingest
            </h3>
            <p className="mt-6">
              AutoGPT can track how different agents are impacting their costs.
            </p>
            <figure className="mt-10 border-l border-indigo-600 pl-9">
              <img
                className="aspect-video rounded-xl bg-gray-50 object-cover"
                src="/assets/blog/agentComparisons.png"
                alt="Agent Comparisons"
              />
              <figcaption className="mt-4 flex gap-x-2 text-sm leading-6 text-gray-500">
                <InformationCircleIcon
                  className="mt-0.5 h-5 w-5 flex-none text-gray-300"
                  aria-hidden="true"
                />
                AutoGPT's agent comparison dashboard
              </figcaption>
            </figure>
            <p className="mt-6">
              If they wish to examine specific requests, they can do this by
              using the filter feature.
            </p>
            <figure className="mt-10 border-l border-indigo-600 pl-9">
              <img
                className="aspect-video rounded-xl bg-gray-50 object-cover"
                src="/assets/blog/agentFilters.png"
                alt="Agent Filters"
              />
              <figcaption className="mt-4 flex gap-x-2 text-sm leading-6 text-gray-500">
                <InformationCircleIcon
                  className="mt-0.5 h-5 w-5 flex-none text-gray-300"
                  aria-hidden="true"
                />
                Filtering feature for examining specific requests
              </figcaption>
            </figure>
            <h3 className="mt-10 text-xl font-bold tracking-tight text-gray-900">
              Determining Cost Savings
            </h3>
            <p className="mt-6">
              For scenarios where testing the agent's functionality is needed
              but calling the API is not, such as small code changes, they can
              monitor their cache usage effortlessly through the dashboards.
              Here's an example:
            </p>
            <figure className="mt-10 border-l border-indigo-600 pl-9">
              <img
                className="aspect-video rounded-xl bg-gray-50 object-cover"
                src="/assets/blog/cachePageStats.png"
                alt="Cache Page Stats"
              />
              <figcaption className="mt-4 flex gap-x-2 text-sm leading-6 text-gray-500">
                <InformationCircleIcon
                  className="mt-0.5 h-5 w-5 flex-none text-gray-300"
                  aria-hidden="true"
                />
                Dashboard showing cache usage statistics
              </figcaption>
            </figure>
            <p className="mt-6">
              We also maintain a log of each cached request, ensuring that
              caching is effective and marking agents as "Cacheable Agents".
            </p>
            <figure className="mt-10 border-l border-indigo-600 pl-9">
              <img
                className="aspect-video rounded-xl bg-gray-50 object-cover"
                src="/assets/blog/cacheRequestTable.png"
                alt="Cache Request Table"
              />
              <figcaption className="mt-4 flex gap-x-2 text-sm leading-6 text-gray-500">
                <InformationCircleIcon
                  className="mt-0.5 h-5 w-5 flex-none text-gray-300"
                  aria-hidden="true"
                />
                Log of each cached request
              </figcaption>
            </figure>
            <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
              Moving Forward
            </h2>
            <p className="mt-6">
              We are currently developing a suite of GraphQL endpoints that
              allow AutoGPT to ingest some of their data easily and add it
              directly to the reports after a run.
            </p>
            <figure className="mt-10 border-l border-indigo-600 pl-9">
              <img
                className="aspect-video rounded-xl bg-gray-50 object-cover"
                src="/assets/blog/graphQL.png"
                alt="GraphQL"
              />
              <figcaption className="mt-4 flex gap-x-2 text-sm leading-6 text-gray-500">
                <InformationCircleIcon
                  className="mt-0.5 h-5 w-5 flex-none text-gray-300"
                  aria-hidden="true"
                />
                GraphQL endpoints in development
              </figcaption>
            </figure>
            <p className="mt-6">
              This development is being paired with deep links so that we can
              have a tight integration between report generation and Helicone.
              Here is a preview of what a benchmark report will look like:
            </p>
            <pre className="mt-8 p-4 bg-gray-800 text-white rounded-md">
              <code>
                {`AutoGPT report
Job-Id: 8AB138BF-3DEA-4E84-BC27-5FE624B956BC
--------------------------------
Challenge go-to-market
  Total Cost: 1.234 USD
  Total time: 10s
  Number of OpenAI calls: 231
  Total Cache hits: 231
  Cache $ saved: $231
  Link: https://helicone.ai/requests?propertyFilters=%5B%7B%22key%22%3A%22challenge%22%2C%22value%22%3A%22got-to-market%22%7D%5D 

  Model breakdown
  |                   | gpt4  | claude | gpt3.5 |
  |-------------------|-------|--------|--------|
  | cost              | $32   | $32    | $32    |
  | prompt tokens     | 42141 | 12     | 213    |
  | completion tokens | 1234  | 124    | 23     |
  | # of requests     | 231   | 3      | 312    |

Challenge send-email
  Total Cost: 1.234 USD
  Total time: 10s
  Number of OpenAI calls: 231
  Total Cache hits: 231
  Cache $ saved: $231
  Link: https://helicone.ai/requests?propertyFilters=%5B%7B%22key%22%3A%22challenge%22%2C%22value%22%3A%22send-email%22%7D%5D 

  Model breakdown
  |                   | gpt4  | claude | gpt3.5 |
  |-------------------|-------|--------|--------|
  | cost              | $32   | $32    | $32    |
  | prompt tokens     | 42141 | 12     | 213    |
  | completion tokens | 1234  | 124    | 23     |
  | # of requests     | 231   | 3      | 312    |

  -------------------
  Challenge Comparisons
    |                   | send-email | go-to-market |
    |-------------------|------------|--------------|
    | cost              | $12        | $32          |
    | prompt tokens     | 42141      | 12           |
    | completion tokens | 1234       | 124          |
    | # of requests     | 231        | 3            |
`}
              </code>
            </pre>
            <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
              Thanks for reading!
            </h2>
            <p className="mt-6">
              Thank you so much for reading our first blog post. We are super
              excited to be partnering with AutoGPT and enable rich logging for
              them and deliver value using Helicone. If you are interested in
              learning more about Helicone or would like to meet the team,
              please email me at justin @ helicone.ai
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </MetaData>
  );
};

export default ExampleBlog;
