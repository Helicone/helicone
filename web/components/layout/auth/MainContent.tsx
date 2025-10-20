import { clsx } from "../../shared/clsx";
import { getUSDate } from "../../shared/utils/utils";

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
  return (
    <div className={clsx("flex flex-1 flex-col overflow-y-auto")}>
      <main className="flex-1">
        {banner && (
          <div className="bg-slate-50">
            <div
              className={clsx(
                "flex w-full items-center justify-center gap-2 bg-sky-500 p-2 text-white",
                banner.onClick &&
                  "cursor-pointer transition-colors hover:bg-sky-600",
              )}
              onClick={banner.onClick}
              role={banner.onClick ? "button" : undefined}
            >
              {banner.updated_at && (
                <>
                  <span className="text-xs font-normal text-sky-100">
                    {getUSDate(new Date(banner.updated_at))}
                  </span>
                  <p className="font-normal text-sky-100">|</p>
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
        <div
          className={clsx("min-h-screen max-h-screen overflow-y-auto bg-background")}
        >
          <div className="mr-auto w-full" key={`${pathname}`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainContent;
