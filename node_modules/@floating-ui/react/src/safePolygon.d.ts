import type { HandleCloseFn } from './hooks/useHover';
import type { ReferenceType } from './types';
export declare function safePolygon<RT extends ReferenceType = ReferenceType>({ restMs, buffer, blockPointerEvents, }?: Partial<{
    restMs: number;
    buffer: number;
    blockPointerEvents: boolean;
}>): HandleCloseFn<RT>;
