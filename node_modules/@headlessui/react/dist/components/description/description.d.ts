import React, { ElementType, ReactNode, Ref } from 'react';
import { Props } from '../../types.js';
import { HasDisplayName, RefProp } from '../../utils/render.js';
interface SharedData {
    slot?: {};
    name?: string;
    props?: {};
}
interface DescriptionProviderProps extends SharedData {
    children: ReactNode;
}
export declare function useDescriptions(): [
    string | undefined,
    (props: DescriptionProviderProps) => JSX.Element
];
declare let DEFAULT_DESCRIPTION_TAG: "p";
export type DescriptionProps<TTag extends ElementType = typeof DEFAULT_DESCRIPTION_TAG> = Props<TTag>;
declare function DescriptionFn<TTag extends ElementType = typeof DEFAULT_DESCRIPTION_TAG>(props: DescriptionProps<TTag>, ref: Ref<HTMLParagraphElement>): React.ReactElement<any, string | React.JSXElementConstructor<any>> | null;
export interface ComponentDescription extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_DESCRIPTION_TAG>(props: DescriptionProps<TTag> & RefProp<typeof DescriptionFn>): JSX.Element;
}
export declare let Description: ComponentDescription;
export {};
