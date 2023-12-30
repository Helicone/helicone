interface Options {
    /**
     * The prefix used for the variants. This defaults to `ui`.
     *
     * Usage example:
     * ```html
     *  <div class="ui-open:underline"></div>
     *  ```
     **/
    prefix?: string;
}
declare const _default: {
    (options: Options): {
        handler: import("tailwindcss/types/config").PluginCreator;
        config?: Partial<import("tailwindcss").Config> | undefined;
    };
    __isOptionsFunction: true;
};
export = _default;
