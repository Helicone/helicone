import React from "react";
export interface SearchSelectProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    icon?: React.ElementType | React.JSXElementConstructor<any>;
    enableClear?: boolean;
    children: React.ReactNode;
}
declare const SearchSelect: React.ForwardRefExoticComponent<SearchSelectProps & React.RefAttributes<HTMLDivElement>>;
export default SearchSelect;
