import Link from "next/link";
import { IconType } from "react-icons";

interface BaseProps {
  label: string;
  icon?: IconType;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type ActionButtonProps = BaseProps &
  ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

export default function ActionButton(props: ActionButtonProps) {
  const baseClasses = `flex items-center gap-2 rounded-xl px-3 py-1.5 font-medium hover:shadow-md border border-slate-100 select-none transition-transform active:scale-95 group ${
    props.disabled
      ? "cursor-not-allowed bg-slate-200 text-slate-400"
      : props.className
  }`;

  const content = (
    <>
      {props.icon && <props.icon className="h-5 w-5 group-hover:scale-105" />}
      <span className="font-medium">{props.label}</span>
      {props.children}
    </>
  );

  if (props.href) {
    return (
      <Link href={props.href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={baseClasses}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {content}
    </button>
  );
}
