import {
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

export function ResetAPIKey({
  setAuthHash,
  authPreview,
}: {
  setAuthHash: (client: string | null) => void;
  authPreview: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {authPreview === "Demo...Demo" ? (
        <div className="flex flex-col gap-2 items-center">
          <div className="flex flex-row justify-center items-center gap-4">
            <ExclamationCircleIcon className="h-6 w-6 text-slate-300" />
            <p className="dark:text-slate-300 text-slate-600">
              You are currently using the demo API Key.
            </p>
          </div>
          <div>
            All of the data associated with this API Key is coming from
            <a
              href="https://demoapp.valyrai.com/"
              className="text-indigo-400 font-bold hover:underline"
            >
              {" "}
              this demo app
            </a>
            .
          </div>
        </div>
      ) : (
        <div className="flex flex-row justify-center items-center gap-4">
          <InformationCircleIcon className="h-6 w-6 text-slate-300" />
          <p className="text-slate-300">
            You are currently viewing API Key{" "}
            <i className="text-slate-300 font-bold">{authPreview}</i>
          </p>
        </div>
      )}

      <div className="flex flex-row justify-center items-center gap-4">
        <button
          className="px-4 py-2 rounded-full text-slate-600 dark:text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-slate-100"
          onClick={() => {
            setAuthHash(null);
          }}
        >
          Reset API key
        </button>
      </div>
    </div>
  );
}
