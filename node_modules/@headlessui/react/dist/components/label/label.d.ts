import React, { ElementType, ReactNode, Ref } from 'react';
import { Props } from '../../types.js';
import { HasDisplayName, RefProp } from '../../utils/render.js';
interface SharedData {
    slot?: {};
    name?: string;
    props?: {};
}
interface LabelProviderProps extends SharedData {
    children: ReactNode;
}
export declare function useLabels(): [string | undefined, (props: LabelProviderProps) => JSX.Element];
declare let DEFAULT_LABEL_TAG: "label";
export type LabelProps<TTag extends ElementType = typeof DEFAULT_LABEL_TAG> = Props<TTag> & {
    passive?: boolean;
};
declare function LabelFn<TTag extends ElementType = typeof DEFAULT_LABEL_TAG>(props: LabelProps<TTag>, ref: Ref<HTMLLabelElement>): React.ReactElement<any, string | React.JSXElementConstructor<any>> | null;
export interface ComponentLabel extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_LABEL_TAG>(props: LabelProps<TTag> & RefProp<typeof LabelFn>): JSX.Element;
}
export declare let Label: ComponentLabel;
export {};
