import React from 'react';
import { CurveFactory } from 'victory-vendor/d3-shape';
import { LayoutType, PresentationAttributesWithProps } from '../util/types';
export declare type CurveType = 'basis' | 'basisClosed' | 'basisOpen' | 'bumpX' | 'bumpY' | 'bump' | 'linear' | 'linearClosed' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter' | CurveFactory;
export interface Point {
    x: number;
    y: number;
}
interface CurveProps {
    className?: string;
    type?: CurveType;
    layout?: LayoutType;
    baseLine?: number | Array<Point>;
    points?: Array<Point>;
    connectNulls?: boolean;
    path?: string;
    pathRef?: (ref: SVGPathElement) => void;
}
export declare type Props = Omit<PresentationAttributesWithProps<CurveProps, SVGPathElement>, 'type' | 'points'> & CurveProps;
export declare const Curve: React.FC<Props>;
export {};
