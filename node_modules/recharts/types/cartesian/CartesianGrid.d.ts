import React, { PureComponent, ReactElement, SVGProps } from 'react';
import { ChartOffset, D3Scale } from '../util/types';
import { Props as XAxisProps } from './XAxis';
import { Props as YAxisProps } from './YAxis';
declare type GridLineType = SVGProps<SVGLineElement> | ReactElement<SVGElement> | ((props: any) => ReactElement<SVGElement>) | boolean;
interface InternalCartesianGridProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    horizontalCoordinatesGenerator?: (props: any, syncWithTicks: boolean) => number[];
    verticalCoordinatesGenerator?: (props: any, syncWithTicks: boolean) => number[];
    xAxis?: Omit<XAxisProps, 'scale'> & {
        scale: D3Scale<string | number>;
    };
    yAxis?: Omit<YAxisProps, 'scale'> & {
        scale: D3Scale<string | number>;
    };
    offset?: ChartOffset;
    chartWidth?: number;
    chartHeight?: number;
}
interface CartesianGridProps extends InternalCartesianGridProps {
    horizontal?: GridLineType;
    vertical?: GridLineType;
    horizontalPoints?: number[];
    verticalPoints?: number[];
    verticalFill?: string[];
    horizontalFill?: string[];
    syncWithTicks?: boolean;
    horizontalValues?: number[] | string[];
    verticalValues?: number[] | string[];
}
export declare type Props = SVGProps<SVGElement> & CartesianGridProps;
export declare class CartesianGrid extends PureComponent<Props> {
    static displayName: string;
    static defaultProps: {
        horizontal: boolean;
        vertical: boolean;
        horizontalPoints: number[];
        verticalPoints: number[];
        stroke: string;
        fill: string;
        verticalFill: string[];
        horizontalFill: string[];
    };
    static renderLineItem(option: GridLineType, props: any): React.JSX.Element;
    renderHorizontal(horizontalPoints: number[]): React.JSX.Element;
    renderVertical(verticalPoints: number[]): React.JSX.Element;
    renderVerticalStripes(verticalPoints: number[]): React.JSX.Element;
    renderHorizontalStripes(horizontalPoints: number[]): React.JSX.Element;
    renderBackground(): React.JSX.Element;
    render(): React.JSX.Element;
}
export {};
