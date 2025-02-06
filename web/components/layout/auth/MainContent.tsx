import { clsx } from "../../shared/clsx";
import { getUSDate } from "../../shared/utils/utils";
import OrgContext, { useOrg } from "../org/organizationContext";

interface MainContentProps {
  children: React.ReactNode;
  banner: BannerType | null;
  pathname: string;
}

export interface BannerType {
  title: string;
  message: React.ReactNode;
  active: boolean;
  created_at?: string;
  id?: string;
  updated_at?: string;
  onClick?: () => void;
}

const MainContent = ({ children, banner, pathname }: MainContentProps) => {
  const org = useOrg();

  return (
    <div className={clsx("flex flex-1 flex-col")}>
      <main className="flex-1">
        {banner && (
          <div className="bg-slate-50">
            <div
              className={clsx(
                "w-full bg-sky-500 p-2 text-white flex items-center justify-center gap-2",
                banner.onClick &&
                  "cursor-pointer hover:bg-sky-600 transition-colors"
              )}
              onClick={banner.onClick}
              role={banner.onClick ? "button" : undefined}
            >
              {banner.updated_at && (
                <>
                  <span className="text-sky-100 text-xs font-normal">
                    {getUSDate(new Date(banner.updated_at))}
                  </span>
                  <p className="text-sky-100 font-normal">|</p>
                </>
              )}

              <p className="text-sm font-semibold">{banner.title}</p>
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
        <div className={clsx("dark:bg-black h-full min-h-screen bg-slate-50")}>
          <OrgContext.Provider value={org}>
            <div
              className="mr-auto w-full min-h-screen"
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
