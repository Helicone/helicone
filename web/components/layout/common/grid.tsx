import clsx from "clsx";
import React from "react";

export const Grid = React.forwardRef(function Grid(
  props: JSX.IntrinsicElements["div"],
  ref: React.Ref<HTMLDivElement>
) {
  const { children, className, ...rest } = props;
  return (
    <div className={clsx(className, "grid")} ref={ref} {...rest}>
      {children}
    </div>
  );
});
