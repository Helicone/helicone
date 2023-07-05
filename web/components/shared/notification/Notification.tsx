import { Transition } from "@headlessui/react";
import {
  CheckBadgeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  MegaphoneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Fragment, useEffect, useState } from "react";
import { clsx } from "../clsx";
import useNotification from "./useNotification";

const Notification = () => {
  const { variant, title, setNotification } = useNotification();

  const [show, setShow] = useState(true);

  const variantBgColor = () => {
    switch (variant) {
      case "success":
        return "bg-green-500";
      case "info":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-green-500";
    }
  };

  const variantIconBgColor = () => {
    switch (variant) {
      case "success":
        return "bg-green-600";
      case "info":
        return "bg-yellow-600";
      case "error":
        return "bg-red-600";
      default:
        return "bg-green-600";
    }
  };

  const variantIcon = () => {
    switch (variant) {
      case "success":
        return (
          <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
        );
      case "info":
        return (
          <InformationCircleIcon
            className="h-5 w-5 text-white"
            aria-hidden="true"
          />
        );
      case "error":
        return (
          <ExclamationCircleIcon
            className="h-5 w-5 text-white"
            aria-hidden="true"
          />
        );
      default:
        return (
          <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
        );
    }
  };

  useEffect(() => {
    setShow(true);
  }, [variant, title]);

  if (variant && title && show) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 pb-8 pt-0 sm:pb-0 sm:top-0 sm:pt-6 z-30">
        <div className="mx-auto w-full sm:max-w-[33vw] px-2 sm:px-6 lg:px-8">
          <Transition
            show={show}
            as={Fragment}
            enter="transform ease-out duration-500 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className={clsx(
                variantBgColor(),
                "rounded-lg px-2 py-1 shadow-lg"
              )}
            >
              <div className="flex flex-wrap items-center justify-between">
                <div className="flex w-0 flex-1 items-center">
                  <span className="flex rounded-lg p-2">{variantIcon()}</span>
                  <p className="ml-3 font-medium text-white text-sm py-1">
                    <span>{title}</span>
                  </p>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    );
  } else {
    return <></>;
  }
};

export default Notification;
