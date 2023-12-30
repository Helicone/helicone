import * as React from 'react';
import type { ElementProps } from './types';
export declare const useInteractions: (propsList?: Array<ElementProps | void>) => {
    getReferenceProps: (userProps?: React.HTMLProps<Element>) => Record<string, unknown>;
    getFloatingProps: (userProps?: React.HTMLProps<HTMLElement>) => Record<string, unknown>;
    getItemProps: (userProps?: React.HTMLProps<HTMLElement>) => Record<string, unknown>;
};
