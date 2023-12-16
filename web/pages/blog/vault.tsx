import {
  CheckCircleIcon,
  CircleStackIcon,
  LockClosedIcon,
} from "@heroicons/react/20/solid";
import NavBarV2 from "../../components/shared/layout/navbar/navBarV2";
import Image from "next/image";
import Head from "next/head";
import { clsx } from "../../components/shared/clsx";
import {
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export default function VaultFeature() {
  return (
    <>
      <Head>
        <title>
          Introducing Vault: Helicone&apos;s Key Management Solution
        </title>
        <meta
          name="description"
          content="Helicone unveils Vault, transforming the way businesses manage and distribute API keys, ensuring enhanced security and streamlined processes."
        />
        <meta name="keywords" content="Vault, Helicone, API Key Management" />
        <link
          rel="canonical"
          href="https://helicone.ai/blog/vault-introduction"
        />
        <link rel="icon" href="/assets/landing/helicone-mobile.webp" />

        <meta
          property="og:title"
          content="Introducing Vault: Helicone's Key Management Solution"
        />
        <meta
          property="og:description"
          content="Helicone unveils Vault, transforming the way businesses manage and distribute API keys, ensuring enhanced security and streamlined processes."
        />
        <meta
          property="og:image"
          content={
            "https://www.helicone.ai/_next/image?url=%2Fassets%2Flanding%2Fhelicone-mobile.webp&w=384&q=75"
          }
        />
        <meta
          property="og:url"
          content="https://helicone.ai/blog/vault-introduction"
        />
      </Head>
      <NavBarV2 />
      <div className="flex w-full justify-center bg-gray-600">
        <Image
          src={"/assets/blog/vault_banner.png"}
          width={1000}
          height={500}
          alt={"Vault Feature"}
        />
      </div>

      <div
        className="bg-gray-50 px-6 py-32 lg:px-8 antialiased"
        style={{
          scrollBehavior: "smooth",
        }}
      >
        <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
          <div className="flex flex-row divide-x divide-gray-200 gap-4 items-center">
            <div className={clsx("flex items-center space-x-3 bottom-0")}>
              <Image
                src={"/assets/blog/colegottdank-headshot.png"}
                width={32}
                height={32}
                alt="Cole Gottdank"
                className="rounded-full"
              />
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Cole Gottdank
              </p>
            </div>

            <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 pl-4">
              <time>Sep 14, 2023</time>
            </p>
          </div>
          <p className="mt-16 text-base font-semibold leading-7 text-orange-500">
            Product Update
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Vault: Simplifying Provider API Key Management
          </h1>
          <p className="mt-6 text-xl leading-8">
            Discover how Vault, our latest feature, redefines the way businesses
            store and distribute provider API keys.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
            The Vault Advantage
          </h2>
          <p className="mt-6">
            In an evolving business landscape, managing multiple API keys can
            become a cumbersome process. Vault, Helicone&apos;s solution to this
            challenge, seamlessly integrates provider API keys like OpenAI and
            provides an efficient way to create and manage Helicone proxy keys.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
            Why Vault Matters for Your Business
          </h2>
          <ul className="mt-8 max-w-xl space-y-8 text-gray-600">
            <li className="flex gap-x-3">
              <CheckCircleIcon
                className="mt-1 h-5 w-5 flex-none text-green-500"
                aria-hidden="true"
              />
              <span>
                <strong className="font-semibold text-gray-900">
                  Simplified Key Management:
                </strong>{" "}
                Just send one key to Helicone, eliminating the hassle of
                handling multiple keys.
              </span>
            </li>
            <li className="flex gap-x-3">
              <LockClosedIcon
                className="mt-1 h-5 w-5 flex-none text-blue-500"
                aria-hidden="true"
              />
              <span>
                <strong className="font-semibold text-gray-900">
                  Enhanced Security:
                </strong>{" "}
                Distribute Helicone keys and ensure all user interactions are
                through our proxy.
              </span>
            </li>
            <li className="flex gap-x-3">
              <CircleStackIcon
                className="mt-1 h-5 w-5 flex-none text-red-500"
                aria-hidden="true"
              />
              <span>
                <strong className="font-semibold text-gray-900">
                  Prevent Bypass:
                </strong>{" "}
                Avoid direct distribution of provider API keys, ensuring users
                benefit from Helicone&apos;s logging and monitoring.
              </span>
            </li>
          </ul>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
            Real-world Use Cases
          </h2>
          <p className="mt-6">
            Beyond the evident advantages of the Vault, its real-world
            applicability is vast. Here are some scenarios where Vault can be a
            game-changer:
          </p>
          <ul className="mt-8 max-w-xl space-y-8 text-gray-600">
            <li className="flex gap-x-3">
              <BuildingStorefrontIcon
                className="mt-1 h-5 w-5 flex-none text-blue-500"
                aria-hidden="true"
              />
              <span>
                <strong className="font-semibold text-gray-900">
                  Departmental Monitoring:
                </strong>{" "}
                SaaS companies can assign unique proxy keys to different
                departments, allowing for separate monitoring and management of
                costs.
              </span>
            </li>
            <li className="flex gap-x-3">
              <ChatBubbleLeftRightIcon
                className="mt-1 h-5 w-5 flex-none text-green-500"
                aria-hidden="true"
              />
              <span>
                <strong className="font-semibold text-gray-900">
                  Hackathons and Temporary Access:
                </strong>{" "}
                Organize events and grant participants temporary, secure access
                without exposing your primary API keys. Post-event, simply
                revoke the temporary keys.
              </span>
            </li>
            <li className="flex gap-x-3">
              <UserGroupIcon
                className="mt-1 h-5 w-5 flex-none text-orange-500"
                aria-hidden="true"
              />
              <span>
                <strong className="font-semibold text-gray-900">
                  Client-based Monitoring:
                </strong>{" "}
                Agencies can provide unique proxy keys to each client, ensuring
                distinct monitoring and billing for API usage.
              </span>
            </li>
          </ul>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
            Simplified Key Management and Revocation
          </h2>
          <p className="mt-6">
            The Vault is also about convenience. Before Vault, the process
            looked like this:
          </p>
          <pre className="mt-4 bg-gray-100 p-4 rounded">
            {`curl --request POST \\
  --url https://oai.hconeai.com/v1/chat/completions \\
  --header 'Authorization: Bearer {OPENAI_KEY}' \\
  --header 'Content-Type: application/json' \\
  --header 'Helicone-Auth: Bearer {HELICONE_API_KEY}' \\
  --data '{
      "model": "gpt-3.5-turbo",
      "messages": [
          {"role": "user", "content": "Hello!"}
      ],
      "temperature": 1,
      "max_tokens": 10
  }'`}
          </pre>
          <p className="mt-6">With Vault, the process is streamlined:</p>
          <pre className="mt-4 bg-gray-100 p-4 rounded">
            {`curl --request POST \\
  --url https://oai.hconeai.com/v1/chat/completions \\
  --header 'Authorization: Bearer {HELICONE_PROXY_KEY}' \\
  --header 'Content-Type: application/json' \\
  --data '{
      "model": "gpt-3.5-turbo",
      "messages": [
          {"role": "user", "content": "Hello!"}
      ],
      "temperature": 1,
      "max_tokens": 10
  }'`}
          </pre>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
            Unparalleled Security with Vault
          </h2>
          <p className="mt-6">
            Helicone takes security seriously. For provider keys, we use
            advanced AEAD encryption with transparent column-level encryption,
            ensuring these keys are safe even from database dumps. As for proxy
            keys, we employ a one-way hash, meaning once generated, they cannot
            be reverse-engineered.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
            Future Roadmap
          </h2>
          <p className="mt-6">
            As we continue to refine and expand Vault, here&apos;s a glimpse
            into the future additions we&apos;re excited about:
          </p>
          <ul className="mt-8 max-w-xl space-y-8 text-gray-600">
            <li className="flex gap-x-3">
              <CircleStackIcon
                className="mt-1 h-5 w-5 flex-none text-blue-500"
                aria-hidden="true"
              />
              <span>
                <strong className="font-semibold text-gray-900">
                  Cost Rate Limits:
                </strong>{" "}
                Set expenditure caps based on proxy key IDs to manage and
                control costs.
              </span>
            </li>
            <li className="flex gap-x-3">
              <CircleStackIcon
                className="mt-1 h-5 w-5 flex-none text-green-500"
                aria-hidden="true"
              />
              <span>
                <strong className="font-semibold text-gray-900">
                  Request Rate Limits:
                </strong>{" "}
                Control the frequency of requests on a per proxy key ID basis,
                preventing any misuse or overuse.
              </span>
            </li>
          </ul>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
            Moving Forward with Vault
          </h2>
          <p className="mt-6">
            As businesses grow and adapt, so do their needs. Helicone is
            committed to innovating and providing solutions like Vault to meet
            these demands. We believe in simplifying processes while maximizing
            security and efficiency. With Vault, we&apos;re one step closer to
            that vision. We&apos;re excited to see how Vault empowers your
            business and are always here to support your journey.
          </p>
        </div>
      </div>
    </>
  );
}
