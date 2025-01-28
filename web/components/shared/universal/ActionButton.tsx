import Link from "next/link";
import { IconType } from "react-icons";
import { ReactElement } from "react";

interface BaseProps {
  label: string;
  icon?: IconType | ReactElement;
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

  const IconComponent = props.icon;

  const content = (
    <>
      {props.icon &&
        (typeof props.icon === "function" ? (
          <props.icon className="group-hover:scale-105" />
        ) : (
          <span className="group-hover:scale-105">{props.icon}</span>
        ))}
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
