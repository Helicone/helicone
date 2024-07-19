export const InfoBanner = () => (
  <div className="bg-[#2D7FF9] text-white">
    <div className="max-w-6xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center">
        <span className="flex-shrink-0 flex p-2 rounded-lg bg-[#1E6FE7]">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </span>
        <p className="ml-3 font-medium text-sm sm:text-base">
          Welcome to the Helicone demo! Complete the onboarding process to
          unlock the full demo on the last step.
        </p>
      </div>
    </div>
  </div>
);
