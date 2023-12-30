import type { FloatingNodeType, ReferenceType } from '../types';
export declare function getAncestors<RT extends ReferenceType = ReferenceType>(nodes: Array<FloatingNodeType<RT>>, id: string | undefined): FloatingNodeType<RT>[];
