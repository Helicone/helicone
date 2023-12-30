import React, { SVGProps } from 'react';
interface CrossProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    top?: number;
    left?: number;
    className?: number;
}
export declare type Props = SVGProps<SVGPathElement> & CrossProps;
export declare const Cross: React.FC<Props>;
export {};
