import { clsx } from "../../shared/clsx";
import { getUSDate } from "../../shared/utils/utils";
import OrgContext, { useOrg } from "../organizationContext";

interface MainContentProps {
  children: React.ReactNode;
  banner: any; // Replace 'any' with the correct type for your banner
  pathname: string;
}

const MainContent = ({ children, banner, pathname }: MainContentProps) => {
  const org = useOrg();

  return (
    <div className={clsx("flex flex-1 flex-col")}>
      <main className="flex-1">
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
