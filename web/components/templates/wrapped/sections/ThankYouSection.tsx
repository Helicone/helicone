import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import Image from "next/image";

export const ThankYouSection: React.FC = () => {
  const router = useRouter();

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex w-full max-w-5xl flex-col items-center gap-12">
        {/* Thank You heading */}
        <h2
          className="text-6xl font-bold text-white sm:text-7xl md:text-8xl lg:text-9xl"
        >
          Thank You <span className="text-4xl sm:text-5xl md:text-6xl">❤️</span>
        </h2>

        {/* Message */}
        <p className="max-w-2xl text-xl text-white/70">
          Thank you for choosing Helicone
          <Image
            src="/assets/wrapped/logo-box.svg"
            alt=""
            width={24}
            height={24}
            className="mb-1 ml-1 inline-block align-middle"
          />
          . Whether you joined us through observability or the AI Gateway,
          we&apos;re happy to have you!
        </p>

        {/* Back to dashboard button */}
        <Button
          onClick={() => router.push("/dashboard")}
          className="bg-[#0DA5E8] px-8 py-6 text-lg text-white hover:bg-[#0DA5E8]/90"
        >
          Back to Dashboard
        </Button>

        {/* Footer */}
        <p className="mt-8 text-sm text-white/40">
          Made with ❤️ by the Helicone team
        </p>
      </div>
    </section>
  );
};
