import React, { PropsWithChildren } from "react";
import { Button, ButtonProps, ButtonVariant } from "@tremor/react";

// Here, HcButtonProps extends ButtonProps but overrides the 'variant' and 'size' to make them non-optional and customized.
interface HcButtonProps extends Omit<ButtonProps, "variant" | "size"> {
  variant: ButtonVariant;
  size: "sm" | "md" | "lg";
  title: string;
  icon?: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
      title?: string | undefined;
      titleId?: string | undefined;
    } & React.RefAttributes<SVGSVGElement>
  >;
}

const HcButton: React.FC<HcButtonProps> = (props) => {
  // Destructuring variant, size, title, and icon from props
  const { variant, size, title, icon, ...rest } = props;

  // Passing all other props using {...rest} to Button component
  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      {...rest}
      className="h-fit"
    >
      {title}
    </Button>
  );
};

export default HcButton;
