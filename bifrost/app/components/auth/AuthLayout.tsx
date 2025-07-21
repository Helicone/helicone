import Image from "next/image";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Dashboard Preview */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#F8FAFC] p-8 lg:flex">
        <div className="flex items-center gap-2">
          <Image
            src="/static/logo.svg"
            alt="Helicone"
            width={150}
            height={40}
            priority
          />
          <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-1">
            <Image
              src="/static/pricing/bouncing-cube.webp"
              alt="Product Hunt"
              width={20}
              height={20}
            />
            <span className="text-sm text-gray-600">Product of the day</span>
            <span className="text-sm font-semibold text-gray-600">1st</span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-2xl">
            <Image
              src="/static/blog/ai-best-practices/cover.webp"
              alt="Dashboard Preview"
              width={800}
              height={600}
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Designed for the entire LLM lifecycle
          </h2>
          <p className="mt-2 text-gray-600">
            The CI workflow to take your LLM application from MVP to production.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Screen */}
      <div className="flex flex-1 items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}
