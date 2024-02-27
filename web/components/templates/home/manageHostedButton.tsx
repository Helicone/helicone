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
        className="underline underline-offset-2 font-semibold text-gray-900"
        onClick={() => setOpen(true)}
      >
        Get Started
      </button>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex flex-col space-y-4 w-[400px]">
          <h1 className="text-2xl font-semibold text-gray-900">
            Manage Hosted
          </h1>
          <p className="text-gray-700 text-sm">
            Deploy your own hosted instance of Helicone on your preferred cloud.
          </p>
          <div className="flex flex-row w-full items-center justify-center gap-8 pt-8 pb-4">
            <button
              onClick={() => {
                router.push("/contact");
              }}
              className="p-4 rounded-lg shadow-lg border border-gray-300"
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
            <div className="p-4 rounded-lg shadow-lg border border-gray-300 relative">
              <Image
                style={{
                  contain: "fit",
                }}
                className="h-8 grayscale"
                src={"/assets/landing/gcp.svg.png"}
                alt=""
              />
              <span className="absolute -top-2 -right-4 bg-gray-100 text-gray-900 ring-gray-300 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset">
                Soon
              </span>
            </div>
            <div className="p-4 rounded-lg shadow-lg border border-gray-300 relative">
              <Image
                style={{
                  contain: "fit",
                }}
                className="h-8 grayscale"
                src={"/assets/landing/azure.svg.png"}
                alt=""
              />
              <span className="absolute -top-2 -right-4 bg-gray-100 text-gray-900 ring-gray-300 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset">
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
