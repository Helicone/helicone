interface PromptVersionPillProps {
  majorVersion: number;
  minorVersion: number;
}

export default function PromptVersionPill({
  majorVersion,
  minorVersion,
}: PromptVersionPillProps) {
  const versionDisplay =
    minorVersion === 0
      ? `v${majorVersion}`
      : `v${majorVersion}.${minorVersion}`;

  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
      {versionDisplay}
    </span>
  );
}
