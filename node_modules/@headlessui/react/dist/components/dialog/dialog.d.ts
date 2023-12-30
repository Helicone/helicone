import React, { ElementType, MutableRefObject, Ref } from 'react';
import { Props } from '../../types.js';
import { PropsForFeatures, HasDisplayName, RefProp } from '../../utils/render.js';
import { ComponentDescription } from '../description/description.js';
declare let DEFAULT_DIALOG_TAG: "div";
interface DialogRenderPropArg {
    open: boolean;
}
type DialogPropsWeControl = 'role' | 'aria-describedby' | 'aria-labelledby' | 'aria-modal';
declare let DialogRenderFeatures: number;
export type DialogProps<TTag extends ElementType> = Props<TTag, DialogRenderPropArg, DialogPropsWeControl, PropsForFeatures<typeof DialogRenderFeatures> & {
    open?: boolean;
    onClose(value: boolean): void;
    initialFocus?: MutableRefObject<HTMLElement | null>;
    __demoMode?: boolean;
}>;
declare function DialogFn<TTag extends ElementType = typeof DEFAULT_DIALOG_TAG>(props: DialogProps<TTag>, ref: Ref<HTMLDivElement>): JSX.Element;
declare let DEFAULT_OVERLAY_TAG: "div";
interface OverlayRenderPropArg {
    open: boolean;
}
type OverlayPropsWeControl = 'aria-hidden';
export type DialogOverlayProps<TTag extends ElementType> = Props<TTag, OverlayRenderPropArg, OverlayPropsWeControl>;
declare function OverlayFn<TTag extends ElementType = typeof DEFAULT_OVERLAY_TAG>(props: DialogOverlayProps<TTag>, ref: Ref<HTMLDivElement>): React.ReactElement<any, string | React.JSXElementConstructor<any>> | null;
declare let DEFAULT_BACKDROP_TAG: "div";
interface BackdropRenderPropArg {
    open: boolean;
}
type BackdropPropsWeControl = 'aria-hidden';
export type DialogBackdropProps<TTag extends ElementType> = Props<TTag, BackdropRenderPropArg, BackdropPropsWeControl>;
declare function BackdropFn<TTag extends ElementType = typeof DEFAULT_BACKDROP_TAG>(props: DialogBackdropProps<TTag>, ref: Ref<HTMLDivElement>): JSX.Element;
declare let DEFAULT_PANEL_TAG: "div";
interface PanelRenderPropArg {
    open: boolean;
}
export type DialogPanelProps<TTag extends ElementType> = Props<TTag, PanelRenderPropArg>;
declare function PanelFn<TTag extends ElementType = typeof DEFAULT_PANEL_TAG>(props: DialogPanelProps<TTag>, ref: Ref<HTMLDivElement>): React.ReactElement<any, string | React.JSXElementConstructor<any>> | null;
declare let DEFAULT_TITLE_TAG: "h2";
interface TitleRenderPropArg {
    open: boolean;
}
export type DialogTitleProps<TTag extends ElementType> = Props<TTag, TitleRenderPropArg>;
declare function TitleFn<TTag extends ElementType = typeof DEFAULT_TITLE_TAG>(props: DialogTitleProps<TTag>, ref: Ref<HTMLHeadingElement>): React.ReactElement<any, string | React.JSXElementConstructor<any>> | null;
interface ComponentDialog extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_DIALOG_TAG>(props: DialogProps<TTag> & RefProp<typeof DialogFn>): JSX.Element;
}
interface ComponentDialogBackdrop extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_BACKDROP_TAG>(props: DialogBackdropProps<TTag> & RefProp<typeof BackdropFn>): JSX.Element;
}
interface ComponentDialogPanel extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_PANEL_TAG>(props: DialogPanelProps<TTag> & RefProp<typeof PanelFn>): JSX.Element;
}
interface ComponentDialogOverlay extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_OVERLAY_TAG>(props: DialogOverlayProps<TTag> & RefProp<typeof OverlayFn>): JSX.Element;
}
interface ComponentDialogTitle extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_TITLE_TAG>(props: DialogTitleProps<TTag> & RefProp<typeof TitleFn>): JSX.Element;
}
interface ComponentDialogDescription extends ComponentDescription {
}
export declare let Dialog: ComponentDialog & {
    Backdrop: ComponentDialogBackdrop;
    Panel: ComponentDialogPanel;
    Overlay: ComponentDialogOverlay;
    Title: ComponentDialogTitle;
    Description: ComponentDialogDescription;
};
export {};
