import { useMemo } from "react";
import { clsx } from "../../shared/clsx";
import { getUSDate } from "../../shared/utils/utils";
import OrgContext, { useOrg } from "../organizationContext";
import Link from "next/link";

interface MainContentProps {
  children: React.ReactNode;
  banner: any; // Replace 'any' with the correct type for your banner
  pathname: string;
}

const MainContent = ({ children, banner, pathname }: MainContentProps) => {
  const org = useOrg();

  const showPricingBanner = useMemo(() => {
    return (
      org?.currentOrg?.tier !== "pro-20240913" &&
      new Date(org?.currentOrg?.created_at ?? 0) < new Date("2024-09-17")
    );
  }, [org?.currentOrg?.tier, org?.currentOrg?.created_at]);

  const isGrowthTier = org?.currentOrg?.tier === "growth";

  return (
    <div className={clsx("flex flex-1 flex-col")}>
      <main className="flex-1">
        {showPricingBanner && (
          <div className="p-4 bg-gradient-to-r from-sky-500 to-indigo-600">
            <div className="max-w-5xl mx-auto bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-white">
                  <h2 className="text-xl font-bold mb-2">
                    Early Adopter Exclusive: $300 Helicone Credit
                  </h2>
                  <p className="text-sm mb-2">
                    Switch to our new Pro plan and get $25/mo off for 12 months.
                    This $300 annual value is offered at no extra cost, as a
                    thank you for your early support.
                  </p>
                  <p className="text-xs text-sky-200 mt-2">
                    Limited time offer: Lock in this special rate for a full
                    year!
                  </p>
                  {isGrowthTier && (
                    <p className="text-xs text-sky-200 mt-2">
                      Growth tier users: Upgrade by October 15th to avoid
                      automatic transition to the free plan.
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-center">
                  <Link href="/settings/billing">
                    <button className="bg-white text-indigo-600 px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-colors shadow-md">
                      Upgrade Now
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        {banner && (
          <div className="p-2">
            <div className="w-full bg-sky-500 rounded-lg p-2 text-white flex items-center justify-center gap-2">
              <span className="text-sky-100 text-xs font-normal">
                {getUSDate(new Date(banner.updated_at))}
              </span>
              <p className="text-sky-100 font-normal">|</p>
              <p className="text-sm font-semibold"> {banner.title}</p>
              <svg
                viewBox="0 0 2 2"
                className="inline h-0.5 w-0.5 fill-current"
                aria-hidden="true"
              >
                <circle cx={1} cy={1} r={1} />
              </svg>
              <p className="text-sm text-gray-100">{banner.message}</p>
            </div>
          </div>
        )}
        <div
          className={clsx(
            "mx-auto px-4 sm:px-8 bg-gray-100 dark:bg-[#17191d] h-full min-h-screen"
          )}
        >
          <OrgContext.Provider value={org}>
            <div
              className="py-4 sm:py-8 mr-auto w-full max-w-[100rem]"
              key={`${pathname}-${org?.renderKey}`}
            >
              {children}
            </div>
          </OrgContext.Provider>
        </div>
      </main>
    </div>
  );
};

export default MainContent;
