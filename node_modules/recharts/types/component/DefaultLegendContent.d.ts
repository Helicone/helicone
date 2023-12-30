import React, { PureComponent, ReactNode, MouseEvent, ReactText, ReactElement } from 'react';
import { DataKey, LegendType, LayoutType, PresentationAttributesAdaptChildEvent } from '../util/types';
export declare type ContentType = ReactElement | ((props: Props) => ReactNode);
export declare type IconType = Exclude<LegendType, 'none'>;
export declare type HorizontalAlignmentType = 'center' | 'left' | 'right';
export declare type VerticalAlignmentType = 'top' | 'bottom' | 'middle';
export declare type Formatter = (value: any, entry: {
    value: any;
    id?: string;
    type?: LegendType;
    color?: string;
    payload?: {
        strokeDasharray: ReactText;
        value?: any;
    };
}, index: number) => ReactNode;
export interface Payload {
    value: any;
    id?: string;
    type?: LegendType;
    color?: string;
    payload?: {
        strokeDasharray: ReactText;
        value?: any;
    };
    formatter?: Formatter;
    inactive?: boolean;
    legendIcon?: ReactElement<SVGElement>;
}
interface InternalProps {
    content?: ContentType;
    iconSize?: number;
    iconType?: IconType;
    layout?: LayoutType;
    align?: HorizontalAlignmentType;
    verticalAlign?: VerticalAlignmentType;
    payload?: Array<Payload>;
    inactiveColor?: string;
    formatter?: Formatter;
    onMouseEnter?: (data: Payload & {
        dataKey?: DataKey<any>;
    }, index: number, event: MouseEvent) => void;
    onMouseLeave?: (data: Payload & {
        dataKey?: DataKey<any>;
    }, index: number, event: MouseEvent) => void;
    onClick?: (data: Payload & {
        dataKey?: DataKey<any>;
    }, index: number, event: MouseEvent) => void;
}
export declare type Props = InternalProps & PresentationAttributesAdaptChildEvent<any, ReactElement>;
export declare class DefaultLegendContent extends PureComponent<Props> {
    static displayName: string;
    static defaultProps: {
        iconSize: number;
        layout: string;
        align: string;
        verticalAlign: string;
        inactiveColor: string;
    };
    renderIcon(data: Payload): React.JSX.Element;
    renderItems(): React.JSX.Element[];
    render(): React.JSX.Element;
}
export {};
