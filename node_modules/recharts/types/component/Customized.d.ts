import React, { Component, FunctionComponent, ReactElement } from 'react';
declare type Comp<P> = FunctionComponent<P> | Component<P> | ReactElement<P>;
export declare type Props<P, C extends Comp<P>> = P & {
    component: C;
};
export declare function Customized<P, C extends Comp<P>>({ component, ...props }: Props<P, C>): React.JSX.Element;
export declare namespace Customized {
    var displayName: string;
}
export {};
