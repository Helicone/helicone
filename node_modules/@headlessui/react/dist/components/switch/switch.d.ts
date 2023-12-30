import React, { ElementType, Ref } from 'react';
import { Props } from '../../types.js';
import { HasDisplayName, RefProp } from '../../utils/render.js';
import { ComponentLabel } from '../label/label.js';
import { ComponentDescription } from '../description/description.js';
declare let DEFAULT_GROUP_TAG: React.ExoticComponent<{
    children?: React.ReactNode;
}>;
export type SwitchGroupProps<TTag extends ElementType> = Props<TTag>;
declare function GroupFn<TTag extends ElementType = typeof DEFAULT_GROUP_TAG>(props: SwitchGroupProps<TTag>): JSX.Element;
declare let DEFAULT_SWITCH_TAG: "button";
interface SwitchRenderPropArg {
    checked: boolean;
}
type SwitchPropsWeControl = 'aria-checked' | 'aria-describedby' | 'aria-labelledby' | 'role' | 'tabIndex';
export type SwitchProps<TTag extends ElementType> = Props<TTag, SwitchRenderPropArg, SwitchPropsWeControl, {
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?(checked: boolean): void;
    name?: string;
    value?: string;
    form?: string;
}>;
declare function SwitchFn<TTag extends ElementType = typeof DEFAULT_SWITCH_TAG>(props: SwitchProps<TTag>, ref: Ref<HTMLButtonElement>): JSX.Element;
interface ComponentSwitch extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_SWITCH_TAG>(props: SwitchProps<TTag> & RefProp<typeof SwitchFn>): JSX.Element;
}
interface ComponentSwitchGroup extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_GROUP_TAG>(props: SwitchGroupProps<TTag> & RefProp<typeof GroupFn>): JSX.Element;
}
interface ComponentSwitchLabel extends ComponentLabel {
}
interface ComponentSwitchDescription extends ComponentDescription {
}
export declare let Switch: ComponentSwitch & {
    Group: ComponentSwitchGroup;
    Label: ComponentSwitchLabel;
    Description: ComponentSwitchDescription;
};
export {};
