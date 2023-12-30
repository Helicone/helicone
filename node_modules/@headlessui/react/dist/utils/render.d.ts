import { ElementType, ReactElement, Ref } from 'react';
import { Props, XOR, __, Expand } from '../types.js';
export declare enum Features {
    /** No features at all */
    None = 0,
    /**
     * When used, this will allow us to use one of the render strategies.
     *
     * **The render strategies are:**
     *    - **Unmount**   _(Will unmount the component.)_
     *    - **Hidden**    _(Will hide the component using the [hidden] attribute.)_
     */
    RenderStrategy = 1,
    /**
     * When used, this will allow the user of our component to be in control. This can be used when
     * you want to transition based on some state.
     */
    Static = 2
}
export declare enum RenderStrategy {
    Unmount = 0,
    Hidden = 1
}
type PropsForFeature<TPassedInFeatures extends Features, TForFeature extends Features, TProps> = {
    [P in TPassedInFeatures]: P extends TForFeature ? TProps : __;
}[TPassedInFeatures];
export type PropsForFeatures<T extends Features> = XOR<PropsForFeature<T, Features.Static, {
    static?: boolean;
}>, PropsForFeature<T, Features.RenderStrategy, {
    unmount?: boolean;
}>>;
export declare function render<TFeature extends Features, TTag extends ElementType, TSlot>({ ourProps, theirProps, slot, defaultTag, features, visible, name, }: {
    ourProps: Expand<Props<TTag, TSlot, any> & PropsForFeatures<TFeature>> & {
        ref?: Ref<HTMLElement | ElementType>;
    };
    theirProps: Expand<Props<TTag, TSlot, any>>;
    slot?: TSlot;
    defaultTag: ElementType;
    features?: TFeature;
    visible?: boolean;
    name: string;
}): ReactElement<any, string | import("react").JSXElementConstructor<any>> | null;
export type HasDisplayName = {
    displayName: string;
};
export type RefProp<T extends Function> = T extends (props: any, ref: Ref<infer RefType>) => any ? {
    ref?: Ref<RefType>;
} : never;
/**
 * This is a hack, but basically we want to keep the full 'API' of the component, but we do want to
 * wrap it in a forwardRef so that we _can_ passthrough the ref
 */
export declare function forwardRefWithAs<T extends {
    name: string;
    displayName?: string;
}>(component: T): T & {
    displayName: string;
};
export declare function compact<T extends Record<any, any>>(object: T): {} & T;
export {};
