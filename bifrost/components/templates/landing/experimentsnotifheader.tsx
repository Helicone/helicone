import Link from "next/link";

export default function ExperimentsNotifHeader() {
  return (
    <div className="mx-0 mb-8 mt-2 flex w-full flex-col items-start justify-between gap-4 rounded-lg border-l-4 border-l-sky-500 bg-sky-500/10 p-2 text-sky-500 md:flex-row md:items-center md:justify-center md:gap-2">
      <h1 className="text-start text-base font-medium leading-tight tracking-tight">
        🎉 Introducing a new way to perfect your prompts.{" "}
        <Link
          href="/experiments"
          target="_blank"
          className="underline decoration-sky-400 decoration-1 underline-offset-2"
        >
          Get early access here.
        </Link>{" "}
      </h1>
    </div>
  );
}
