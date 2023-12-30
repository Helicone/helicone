import { ElementType, MutableRefObject, Ref } from 'react';
import { Props, ReactTag } from '../../types.js';
import { Features, HasDisplayName, PropsForFeatures, RefProp } from '../../utils/render.js';
export interface TransitionClasses {
    enter?: string;
    enterFrom?: string;
    enterTo?: string;
    entered?: string;
    leave?: string;
    leaveFrom?: string;
    leaveTo?: string;
}
export interface TransitionEvents {
    beforeEnter?: () => void;
    afterEnter?: () => void;
    beforeLeave?: () => void;
    afterLeave?: () => void;
}
export type TransitionChildProps<TTag extends ReactTag> = Props<TTag, TransitionChildRenderPropArg, never, PropsForFeatures<typeof TransitionChildRenderFeatures> & TransitionClasses & TransitionEvents & {
    appear?: boolean;
}>;
declare let DEFAULT_TRANSITION_CHILD_TAG: "div";
type TransitionChildRenderPropArg = MutableRefObject<HTMLDivElement>;
declare let TransitionChildRenderFeatures: Features;
declare function TransitionChildFn<TTag extends ElementType = typeof DEFAULT_TRANSITION_CHILD_TAG>(props: TransitionChildProps<TTag>, ref: Ref<HTMLElement>): JSX.Element;
export type TransitionRootProps<TTag extends ElementType> = TransitionChildProps<TTag> & {
    show?: boolean;
    appear?: boolean;
};
declare function TransitionRootFn<TTag extends ElementType = typeof DEFAULT_TRANSITION_CHILD_TAG>(props: TransitionRootProps<TTag>, ref: Ref<HTMLElement>): JSX.Element;
interface ComponentTransitionRoot extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_TRANSITION_CHILD_TAG>(props: TransitionRootProps<TTag> & RefProp<typeof TransitionRootFn>): JSX.Element;
}
interface ComponentTransitionChild extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_TRANSITION_CHILD_TAG>(props: TransitionChildProps<TTag> & RefProp<typeof TransitionChildFn>): JSX.Element;
}
export declare let Transition: ComponentTransitionRoot & {
    Child: ComponentTransitionChild;
    Root: ComponentTransitionRoot;
};
export {};
