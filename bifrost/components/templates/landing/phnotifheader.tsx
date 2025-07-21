export default function PhNotifHeader() {
  return (
    <div className="mx-0 mb-8 mt-2 flex w-full flex-col items-start justify-between gap-4 rounded-lg border-l-4 border-l-sky-500 bg-sky-500/10 p-2 text-sky-500 md:flex-row md:items-center md:justify-center md:gap-2">
      <h1 className="text-md text-start font-medium tracking-tight">
        🎉 We&apos;d love your support!{" "}
        <a
          href="https://www.producthunt.com/new/products/helicone-ai"
          target="_blank"
          className="underline decoration-sky-400 decoration-1 underline-offset-2"
        >
          Get notified
        </a>{" "}
        about our Product Hunt launch tomorrow.
      </h1>
    </div>
  );
}
