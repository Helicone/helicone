import React, { SVGProps } from 'react';
import { Props as XAxisProps } from './XAxis';
import { Props as YAxisProps } from './YAxis';
import { D3Scale, DataKey } from '../util/types';
import { BarRectangleItem } from './Bar';
import { LinePointItem } from './Line';
import { ScatterPointItem } from './Scatter';
export interface ErrorBarDataItem {
    x: number;
    y: number;
    value: number;
    errorVal?: number[] | number;
}
export declare type ErrorBarDataPointFormatter = (entry: BarRectangleItem | LinePointItem | ScatterPointItem, dataKey: DataKey<any>) => ErrorBarDataItem;
interface InternalErrorBarProps {
    xAxis?: Omit<XAxisProps, 'scale'> & {
        scale: D3Scale<string | number>;
    };
    yAxis?: Omit<YAxisProps, 'scale'> & {
        scale: D3Scale<string | number>;
    };
    data?: any[];
    layout?: 'horizontal' | 'vertical';
    dataPointFormatter?: ErrorBarDataPointFormatter;
    offset?: number;
}
interface ErrorBarProps extends InternalErrorBarProps {
    dataKey: DataKey<any>;
    width?: number;
    direction?: 'x' | 'y';
}
export declare type Props = SVGProps<SVGLineElement> & ErrorBarProps;
export declare function ErrorBar(props: Props): React.JSX.Element;
export declare namespace ErrorBar {
    var defaultProps: {
        stroke: string;
        strokeWidth: number;
        width: number;
        offset: number;
        layout: string;
    };
    var displayName: string;
}
export {};
