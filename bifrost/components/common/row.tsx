import clsx from "clsx";
import React from "react";

export const Row = React.forwardRef(function Row(
  props: JSX.IntrinsicElements["div"],
  ref: React.Ref<HTMLDivElement>
) {
  const { children, className, ...rest } = props;
  return (
    <div className={clsx(className, "flex flex-row")} ref={ref} {...rest}>
      {children}
    </div>
  );
});
