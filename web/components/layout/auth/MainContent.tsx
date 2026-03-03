import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

const MINTLIFY_BANNER_DISMISSED_KEY = "mintlify-banner-dismissed";

const MintlifyBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(MINTLIFY_BANNER_DISMISSED_KEY) === "true";
  });
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <div className="relative bg-sky-600 px-4 py-3 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm font-semibold">
              🎉 Helicone has joined Mintlify
            </p>
            <p className="hidden text-sm text-sky-100 sm:block">
              Transitioning to maintenance mode.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="https://www.helicone.ai/blog/joining-mintlify"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap rounded-md bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/30"
            >
              Learn more
            </Link>
            <button
              onClick={() => setShowOfferModal(true)}
              className="whitespace-nowrap rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition-colors hover:bg-sky-50"
            >
              🎁 Redeem Mintlify offer
            </button>
            <button
              onClick={() => setShowDismissModal(true)}
              className="ml-1 rounded-sm p-0.5 text-white/70 transition-colors hover:text-white"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Redeem Offer Modal */}
      <Dialog open={showOfferModal} onOpenChange={setShowOfferModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎁 Exclusive Mintlify Offer</DialogTitle>
            <DialogDescription>
              A thank you for being a loyal Helicone customer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Get <strong className="text-foreground">50% off Mintlify Pro</strong>{" "}
              for 6 months. Use the promo code below at checkout:
            </p>
            <div className="flex items-center justify-center gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950">
              <span className="text-sm text-muted-foreground">Promo code:</span>
              <code className="rounded bg-sky-100 px-3 py-1.5 font-mono text-lg font-bold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                HELICONE
              </code>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfferModal(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                window.open("https://mintlify.com/pricing", "_blank", "noopener,noreferrer");
              }}
            >
              Go to Mintlify pricing →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dismiss Confirmation Modal */}
      <Dialog open={showDismissModal} onOpenChange={setShowDismissModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss this banner?</DialogTitle>
            <DialogDescription>
              Are you sure you want to hide the Mintlify announcement? You can
              still find details at{" "}
              <Link
                href="https://www.helicone.ai/blog/joining-mintlify"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500 hover:text-sky-600 underline"
              >
                helicone.ai/blog/joining-mintlify
              </Link>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDismissModal(false)}
            >
              Keep showing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                localStorage.setItem(MINTLIFY_BANNER_DISMISSED_KEY, "true");
                setDismissed(true);
                setShowDismissModal(false);
              }}
            >
              Dismiss
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const MainContent = ({ children, banner, pathname }: MainContentProps) => {
  return (
    <div
      className={clsx(
        "scrollbar-auto-hide flex h-full flex-col overflow-y-auto",
      )}
    >
      <main className="flex-1">
        <MintlifyBanner />
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
