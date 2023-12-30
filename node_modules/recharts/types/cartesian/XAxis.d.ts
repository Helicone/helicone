import type { FunctionComponent, SVGProps } from 'react';
import { BaseAxisProps, AxisInterval } from '../util/types';
interface XAxisProps extends BaseAxisProps {
    xAxisId?: string | number;
    width?: number;
    height?: number;
    mirror?: boolean;
    orientation?: 'top' | 'bottom';
    ticks?: (string | number)[];
    padding?: {
        left?: number;
        right?: number;
    } | 'gap' | 'no-gap';
    minTickGap?: number;
    interval?: AxisInterval;
    reversed?: boolean;
    angle?: number;
    tickMargin?: number;
}
export declare type Props = Omit<SVGProps<SVGElement>, 'scale'> & XAxisProps;
export declare const XAxis: FunctionComponent<Props>;
export {};
