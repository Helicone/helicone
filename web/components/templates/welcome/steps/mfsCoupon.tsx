import { useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";

interface MfsCouponProps {
  nextStep: () => void;
}

const MfsCoupon = (props: MfsCouponProps) => {
  const { nextStep } = props;

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500); // delay of 500ms
    return () => clearTimeout(timer); // this will clear Timeout
    // when component unmount like in willComponentUnmount
  }, []);

  return (
    <div
      className={clsx(
        `transition-all duration-700 ease-in-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`,
        "flex w-full flex-col items-center px-2 text-center",
      )}
    >
      <p className="mt-8 text-2xl font-semibold md:text-5xl">
        Microsoft for Startups Founders Hup
      </p>
      <p className="text-md mt-5 font-light text-gray-700 md:text-lg">
        Please use the following coupon code to get 9 months free of Helicone
        Pro.
      </p>
      <p className="mt-8 text-2xl font-semibold md:text-5xl">MSFTHELI</p>
      <button
        onClick={nextStep}
        className="mt-8 rounded-xl bg-gray-900 px-28 py-3 font-medium text-white hover:bg-gray-700"
      >
        Finish Onboarding
      </button>
    </div>
  );
};

export default MfsCoupon;
