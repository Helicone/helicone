import React, { ElementType, MutableRefObject, Ref } from 'react';
import { Props } from '../../types.js';
import { PropsForFeatures, HasDisplayName, RefProp } from '../../utils/render.js';
declare let DEFAULT_DISCLOSURE_TAG: React.ExoticComponent<{
    children?: React.ReactNode;
}>;
interface DisclosureRenderPropArg {
    open: boolean;
    close(focusableElement?: HTMLElement | MutableRefObject<HTMLElement | null>): void;
}
export type DisclosureProps<TTag extends ElementType> = Props<TTag, DisclosureRenderPropArg> & {
    defaultOpen?: boolean;
};
declare function DisclosureFn<TTag extends ElementType = typeof DEFAULT_DISCLOSURE_TAG>(props: DisclosureProps<TTag>, ref: Ref<HTMLElement>): JSX.Element;
declare let DEFAULT_BUTTON_TAG: "button";
interface ButtonRenderPropArg {
    open: boolean;
}
type ButtonPropsWeControl = 'aria-controls' | 'aria-expanded';
export type DisclosureButtonProps<TTag extends ElementType> = Props<TTag, ButtonRenderPropArg, ButtonPropsWeControl, {
    disabled?: boolean;
}>;
declare function ButtonFn<TTag extends ElementType = typeof DEFAULT_BUTTON_TAG>(props: DisclosureButtonProps<TTag>, ref: Ref<HTMLButtonElement>): React.ReactElement<any, string | React.JSXElementConstructor<any>> | null;
declare let DEFAULT_PANEL_TAG: "div";
interface PanelRenderPropArg {
    open: boolean;
    close: (focusableElement?: HTMLElement | MutableRefObject<HTMLElement | null>) => void;
}
declare let PanelRenderFeatures: number;
export type DisclosurePanelProps<TTag extends ElementType> = Props<TTag, PanelRenderPropArg> & PropsForFeatures<typeof PanelRenderFeatures>;
declare function PanelFn<TTag extends ElementType = typeof DEFAULT_PANEL_TAG>(props: DisclosurePanelProps<TTag>, ref: Ref<HTMLDivElement>): JSX.Element;
interface ComponentDisclosure extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_DISCLOSURE_TAG>(props: DisclosureProps<TTag> & RefProp<typeof DisclosureFn>): JSX.Element;
}
interface ComponentDisclosureButton extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_BUTTON_TAG>(props: DisclosureButtonProps<TTag> & RefProp<typeof ButtonFn>): JSX.Element;
}
interface ComponentDisclosurePanel extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_PANEL_TAG>(props: DisclosurePanelProps<TTag> & RefProp<typeof PanelFn>): JSX.Element;
}
export declare let Disclosure: ComponentDisclosure & {
    Button: ComponentDisclosureButton;
    Panel: ComponentDisclosurePanel;
};
export {};
