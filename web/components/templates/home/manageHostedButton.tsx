import { useState } from "react";
import ThemedModal from "../../shared/themed/themedModal";
import Image from "next/image";
import { useRouter } from "next/router";

const ManageHostedButton = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        className="font-semibold text-gray-900 underline underline-offset-2"
        onClick={() => setOpen(true)}
      >
        Get Started
      </button>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex w-[400px] flex-col space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Manage Hosted
          </h1>
          <p className="text-sm text-gray-700">
            Deploy your own hosted instance of Helicone on your preferred cloud.
          </p>
          <div className="flex w-full flex-row items-center justify-center gap-8 pb-4 pt-8">
            <button
              onClick={() => {
                router.push("/contact");
              }}
              className="rounded-lg border border-gray-300 p-4 shadow-lg"
            >
              <Image
                style={{
                  contain: "fit",
                }}
                className="h-8"
                src={"/assets/landing/aws.svg.png"}
                alt=""
              />
            </button>
            <div className="relative rounded-lg border border-gray-300 p-4 shadow-lg">
              <Image
                style={{
                  contain: "fit",
                }}
                className="h-8 grayscale"
                src={"/assets/landing/gcp.svg.png"}
                alt=""
              />
              <span className="absolute -right-4 -top-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 ring-1 ring-inset ring-gray-300">
                Soon
              </span>
            </div>
            <div className="relative rounded-lg border border-gray-300 p-4 shadow-lg">
              <Image
                style={{
                  contain: "fit",
                }}
                className="h-8 grayscale"
                src={"/assets/landing/azure.svg.png"}
                alt=""
              />
              <span className="absolute -right-4 -top-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 ring-1 ring-inset ring-gray-300">
                Soon
              </span>
            </div>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default ManageHostedButton;
