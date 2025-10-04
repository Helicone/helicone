import clsx from "clsx";
import React, { forwardRef, Ref } from "react";
export const Card = forwardRef(function Grid(
  props: JSX.IntrinsicElements["div"],
  ref: Ref<HTMLDivElement>,
) {
  const { children, className, ...rest } = props;
  return (
    <div
      className={clsx(className, "rounded-lg border-2 p-[16px]")}
      ref={ref}
      {...rest}
    >
      {children}
    </div>
  );
});
