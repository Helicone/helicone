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
  dismissible?: boolean;
  onDismiss?: () => void;
}

const MainContent = ({ children, banner, pathname }: MainContentProps) => {
  return (
    <div
      className={clsx(
        "scrollbar-auto-hide flex h-full flex-col overflow-y-auto",
      )}
    >
      <main className="flex-1">
        {banner && (
          <div>
            <div
              className={clsx(
                "relative flex w-full items-center justify-center gap-2 bg-sky-500 p-2 text-white",
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

              {banner.dismissible && banner.onDismiss && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    banner.onDismiss?.();
                  }}
                  className="absolute right-4 text-white/80 transition-colors hover:text-white"
                  aria-label="Dismiss"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
        <div className={clsx("bg-background")}>
          <div className="mr-auto w-full" key={`${pathname}`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainContent;
