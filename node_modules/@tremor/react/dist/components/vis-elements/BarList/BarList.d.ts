import { Color, ValueFormatter } from "lib";
import React from "react";
type Bar = {
    key?: string;
    value: number;
    name: string;
    icon?: React.JSXElementConstructor<any>;
    href?: string;
    target?: string;
    color?: Color;
};
export interface BarListProps extends React.HTMLAttributes<HTMLDivElement> {
    data: Bar[];
    valueFormatter?: ValueFormatter;
    color?: Color;
    showAnimation?: boolean;
}
declare const BarList: React.ForwardRefExoticComponent<BarListProps & React.RefAttributes<HTMLDivElement>>;
export default BarList;
