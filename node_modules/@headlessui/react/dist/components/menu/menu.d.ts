import React, { ElementType, Ref } from 'react';
import { Props } from '../../types.js';
import { PropsForFeatures, HasDisplayName, RefProp } from '../../utils/render.js';
declare let DEFAULT_MENU_TAG: React.ExoticComponent<{
    children?: React.ReactNode;
}>;
interface MenuRenderPropArg {
    open: boolean;
    close: () => void;
}
export type MenuProps<TTag extends ElementType> = Props<TTag, MenuRenderPropArg, never, {
    __demoMode?: boolean;
}>;
declare function MenuFn<TTag extends ElementType = typeof DEFAULT_MENU_TAG>(props: MenuProps<TTag>, ref: Ref<HTMLElement>): JSX.Element;
declare let DEFAULT_BUTTON_TAG: "button";
interface ButtonRenderPropArg {
    open: boolean;
}
type ButtonPropsWeControl = 'aria-controls' | 'aria-expanded' | 'aria-haspopup';
export type MenuButtonProps<TTag extends ElementType> = Props<TTag, ButtonRenderPropArg, ButtonPropsWeControl, {
    disabled?: boolean;
}>;
declare function ButtonFn<TTag extends ElementType = typeof DEFAULT_BUTTON_TAG>(props: MenuButtonProps<TTag>, ref: Ref<HTMLButtonElement>): React.ReactElement<any, string | React.JSXElementConstructor<any>> | null;
declare let DEFAULT_ITEMS_TAG: "div";
interface ItemsRenderPropArg {
    open: boolean;
}
type ItemsPropsWeControl = 'aria-activedescendant' | 'aria-labelledby' | 'role' | 'tabIndex';
declare let ItemsRenderFeatures: number;
export type MenuItemsProps<TTag extends ElementType> = Props<TTag, ItemsRenderPropArg, ItemsPropsWeControl> & PropsForFeatures<typeof ItemsRenderFeatures>;
declare function ItemsFn<TTag extends ElementType = typeof DEFAULT_ITEMS_TAG>(props: MenuItemsProps<TTag>, ref: Ref<HTMLDivElement>): React.ReactElement<any, string | React.JSXElementConstructor<any>> | null;
declare let DEFAULT_ITEM_TAG: React.ExoticComponent<{
    children?: React.ReactNode;
}>;
interface ItemRenderPropArg {
    active: boolean;
    disabled: boolean;
    close: () => void;
}
type ItemPropsWeControl = 'aria-disabled' | 'role' | 'tabIndex';
export type MenuItemProps<TTag extends ElementType> = Props<TTag, ItemRenderPropArg, ItemPropsWeControl> & {
    disabled?: boolean;
};
declare function ItemFn<TTag extends ElementType = typeof DEFAULT_ITEM_TAG>(props: MenuItemProps<TTag>, ref: Ref<HTMLElement>): React.ReactElement<any, string | React.JSXElementConstructor<any>> | null;
interface ComponentMenu extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_MENU_TAG>(props: MenuProps<TTag> & RefProp<typeof MenuFn>): JSX.Element;
}
interface ComponentMenuButton extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_BUTTON_TAG>(props: MenuButtonProps<TTag> & RefProp<typeof ButtonFn>): JSX.Element;
}
interface ComponentMenuItems extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_ITEMS_TAG>(props: MenuItemsProps<TTag> & RefProp<typeof ItemsFn>): JSX.Element;
}
interface ComponentMenuItem extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_ITEM_TAG>(props: MenuItemProps<TTag> & RefProp<typeof ItemFn>): JSX.Element;
}
export declare let Menu: ComponentMenu & {
    Button: ComponentMenuButton;
    Items: ComponentMenuItems;
    Item: ComponentMenuItem;
};
export {};
