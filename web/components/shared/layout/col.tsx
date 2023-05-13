import clsx from "clsx";
import React from "react";

export const Col = React.forwardRef(function Col(
  props: JSX.IntrinsicElements["div"],
  ref: React.Ref<HTMLDivElement>
) {
  const { children, className, ...rest } = props;

  return (
    <div className={clsx(className, "flex flex-col")} ref={ref} {...rest}>
      {children}
    </div>
  );
});
