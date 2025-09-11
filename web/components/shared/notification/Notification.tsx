import { Transition } from "@headlessui/react";

import { useEffect, useState } from "react";
import { clsx } from "../clsx";
import useNotification from "./useNotification";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

const Notification = () => {
  const { variant, title, clearNotification } = useNotification();

  const [show, setShow] = useState(true);

  const variantBgColor = () => {
    switch (variant) {
      case "success":
        return "bg-green-100";
      case "info":
        return "bg-yellow-100";
      case "error":
        return "bg-red-100";
      default:
        return "bg-green-100";
    }
  };

  const variantTextColor = () => {
    switch (variant) {
      case "success":
        return "text-green-700";
      case "info":
        return "text-yellow-700";
      case "error":
        return "text-red-700";
      default:
        return "text-green-700";
    }
  };

  const variantBorderColor = () => {
    switch (variant) {
      case "success":
        return "border-green-200";
      case "info":
        return "border-yellow-200";
      case "error":
        return "border-red-200";
      default:
        return "border-green-200";
    }
  };

  const variantIcon = () => {
    switch (variant) {
      case "success":
        return (
          <CheckCircleIcon
            className="h-5 w-5 text-green-400"
            aria-hidden="true"
          />
        );
      case "info":
        return (
          <InformationCircleIcon
            className="h-5 w-5 text-yellow-400"
            aria-hidden="true"
          />
        );
      case "error":
        return (
          <ExclamationCircleIcon
            className="h-5 w-5 text-red-400"
            aria-hidden="true"
          />
        );
      default:
        return (
          <CheckCircleIcon
            className="h-5 w-5 text-green-500"
            aria-hidden="true"
          />
        );
    }
  };

  useEffect(() => {
    setShow(true);
  }, [variant, title]);

  return (
    <Transition
      show={(variant && title && show) || false}
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      className="fixed inset-x-0 top-0 z-50 pt-6"
    >
      <div className="fixed inset-x-0 bottom-0 z-50 pb-8 pt-0 sm:top-0 sm:pb-0 sm:pt-6">
        <div className="mx-auto w-full px-2 sm:max-w-[33vw] sm:px-6 lg:px-8">
          <div
            className={clsx(
              variantBgColor(),
              variantBorderColor(),
              "rounded-lg border px-2 py-1 shadow-xl",
            )}
          >
            <div className="flex flex-wrap items-center justify-between">
              <div className="pointer-events-none flex w-0 flex-1 items-center">
                <span className="flex rounded-lg p-2">{variantIcon()}</span>
                <p
                  className={clsx(
                    variantTextColor(),
                    "ml-3 py-1 text-sm font-medium",
                  )}
                >
                  <span>{title}</span>
                </p>
              </div>
              <div className="ml-auto mr-2">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => {
                      setShow(false);
                      setTimeout(() => {
                        clearNotification();
                      }, 150);
                    }}
                    className={clsx(
                      variantBgColor(),
                      variantTextColor(),
                      "inline-flex rounded-md p-1.5 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50",
                    )}
                  >
                    <span className="sr-only">Dismiss</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
};

export default Notification;
