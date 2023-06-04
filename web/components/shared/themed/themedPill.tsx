export const ThemedPill = ({
  onDelete,
  label,
}: {
  label: string;
  onDelete?: () => void;
}) => {
  return (
    <span className="inline-flex items-center rounded-2xl bg-sky-100 py-1.5 pl-4 pr-2 text-sm font-medium text-sky-700 border border-sky-300">
      {label}
      <button
        onClick={onDelete}
        type="button"
        className="ml-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-sky-400 hover:bg-indigo-200 hover:text-sky-500 focus:bg-sky-500 focus:text-white focus:outline-none"
      >
        <span className="sr-only">Remove large option</span>
        <svg
          className="h-2.5 w-2.5"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 8 8"
        >
          <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
        </svg>
      </button>
    </span>
  );
};
