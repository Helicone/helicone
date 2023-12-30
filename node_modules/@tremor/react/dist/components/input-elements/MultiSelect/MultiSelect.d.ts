import React from "react";
export interface MultiSelectProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultValue?: string[];
    value?: string[];
    onValueChange?: (value: string[]) => void;
    placeholder?: string;
    placeholderSearch?: string;
    disabled?: boolean;
    icon?: React.ElementType | React.JSXElementConstructor<any>;
    children: React.ReactNode;
}
declare const MultiSelect: React.ForwardRefExoticComponent<MultiSelectProps & React.RefAttributes<HTMLDivElement>>;
export default MultiSelect;
