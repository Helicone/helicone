import { ElementType, Ref } from 'react';
import { Props } from '../../types.js';
import { RefProp, HasDisplayName } from '../../utils/render.js';
import { ComponentLabel } from '../../components/label/label.js';
import { ComponentDescription } from '../../components/description/description.js';
declare let DEFAULT_RADIO_GROUP_TAG: "div";
interface RadioGroupRenderPropArg<TType> {
    value: TType;
}
type RadioGroupPropsWeControl = 'role' | 'aria-labelledby' | 'aria-describedby';
export type RadioGroupProps<TTag extends ElementType, TType> = Props<TTag, RadioGroupRenderPropArg<TType>, RadioGroupPropsWeControl, {
    value?: TType;
    defaultValue?: TType;
    onChange?(value: TType): void;
    by?: (keyof TType & string) | ((a: TType, z: TType) => boolean);
    disabled?: boolean;
    form?: string;
    name?: string;
}>;
declare function RadioGroupFn<TTag extends ElementType = typeof DEFAULT_RADIO_GROUP_TAG, TType = string>(props: RadioGroupProps<TTag, TType>, ref: Ref<HTMLElement>): JSX.Element;
declare let DEFAULT_OPTION_TAG: "div";
interface OptionRenderPropArg {
    checked: boolean;
    active: boolean;
    disabled: boolean;
}
type OptionPropsWeControl = 'aria-checked' | 'aria-describedby' | 'aria-lablledby' | 'role' | 'tabIndex';
export type RadioOptionProps<TTag extends ElementType, TType> = Props<TTag, OptionRenderPropArg, OptionPropsWeControl, {
    value: TType;
    disabled?: boolean;
}>;
declare function OptionFn<TTag extends ElementType = typeof DEFAULT_OPTION_TAG, TType = Parameters<typeof RadioGroupRoot>[0]['value']>(props: RadioOptionProps<TTag, TType>, ref: Ref<HTMLElement>): JSX.Element;
interface ComponentRadioGroup extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_RADIO_GROUP_TAG, TType = string>(props: RadioGroupProps<TTag, TType> & RefProp<typeof RadioGroupFn>): JSX.Element;
}
interface ComponentRadioOption extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_OPTION_TAG, TType = string>(props: RadioOptionProps<TTag, TType> & RefProp<typeof OptionFn>): JSX.Element;
}
interface ComponentRadioLabel extends ComponentLabel {
}
interface ComponentRadioDescription extends ComponentDescription {
}
declare let RadioGroupRoot: ComponentRadioGroup;
export declare let RadioGroup: ComponentRadioGroup & {
    Option: ComponentRadioOption;
    Label: ComponentRadioLabel;
    Description: ComponentRadioDescription;
};
export {};
