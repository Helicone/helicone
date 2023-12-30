import React, { ReactElement, ReactNode, Component, SVGProps } from 'react';
import { CartesianViewBox, PresentationAttributesAdaptChildEvent, CartesianTickItem, AxisInterval } from '../util/types';
export declare type Orientation = 'top' | 'bottom' | 'left' | 'right';
export declare type Unit = string | number;
export declare type TickFormatter = (value: any, index: number) => string;
export interface CartesianAxisProps {
    className?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    unit?: Unit;
    orientation?: Orientation;
    viewBox?: CartesianViewBox;
    tick?: SVGProps<SVGTextElement> | ReactElement<SVGElement> | ((props: any) => ReactElement<SVGElement>) | boolean;
    axisLine?: boolean | SVGProps<SVGLineElement>;
    tickLine?: boolean | SVGProps<SVGLineElement>;
    mirror?: boolean;
    tickMargin?: number;
    hide?: boolean;
    label?: any;
    minTickGap?: number;
    ticks?: CartesianTickItem[];
    tickSize?: number;
    tickFormatter?: TickFormatter;
    ticksGenerator?: (props?: CartesianAxisProps) => CartesianTickItem[];
    interval?: AxisInterval;
    angle?: number;
}
interface IState {
    fontSize: string;
    letterSpacing: string;
}
export declare type Props = Omit<PresentationAttributesAdaptChildEvent<any, SVGElement>, 'viewBox'> & CartesianAxisProps;
export declare class CartesianAxis extends Component<Props, IState> {
    static displayName: string;
    static defaultProps: {
        x: number;
        y: number;
        width: number;
        height: number;
        viewBox: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        orientation: string;
        ticks: CartesianTickItem[];
        stroke: string;
        tickLine: boolean;
        axisLine: boolean;
        tick: boolean;
        mirror: boolean;
        minTickGap: number;
        tickSize: number;
        tickMargin: number;
        interval: string;
    };
    private layerReference;
    constructor(props: Props);
    shouldComponentUpdate({ viewBox, ...restProps }: Props, nextState: IState): boolean;
    componentDidMount(): void;
    getTickLineCoord(data: CartesianTickItem): {
        line: {
            x1: number;
            y1: number;
            x2: number;
            y2: number;
        };
        tick: {
            x: number;
            y: number;
        };
    };
    getTickTextAnchor(): string;
    getTickVerticalAnchor(): string;
    renderAxisLine(): React.JSX.Element;
    static renderTickItem(option: Props['tick'], props: any, value: ReactNode): React.JSX.Element;
    renderTicks(ticks: CartesianTickItem[], fontSize: string, letterSpacing: string): React.JSX.Element;
    render(): React.JSX.Element;
}
export {};
