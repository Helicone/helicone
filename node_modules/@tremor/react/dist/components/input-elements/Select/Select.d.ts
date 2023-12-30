import React from "react";
export interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    icon?: React.JSXElementConstructor<any>;
    enableClear?: boolean;
    children: React.ReactNode;
}
declare const Select: React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<HTMLDivElement>>;
export default Select;
