import * as React from 'react';
/**
 * Merges an array of refs into a single memoized callback ref or `null`.
 * @see https://floating-ui.com/docs/useMergeRefs
 */
export declare function useMergeRefs<Instance>(refs: Array<React.Ref<Instance>>): React.RefCallback<Instance> | null;
