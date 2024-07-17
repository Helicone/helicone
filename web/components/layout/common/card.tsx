import clsx from "clsx";
import React from "react";

export const Card = React.forwardRef(function Grid(
  props: JSX.IntrinsicElements["div"],
  ref: React.Ref<HTMLDivElement>
) {
  const { children, className, ...rest } = props;
  return (
    <div
      className={clsx(className, "border-2 rounded-lg p-[16px]")}
      ref={ref}
      {...rest}
    >
      {children}
    </div>
  );
});
