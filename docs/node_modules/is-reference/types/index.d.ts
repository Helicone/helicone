declare module 'is-reference' {
	export default function is_reference(node: NodeWithPropertyDefinition, parent: NodeWithPropertyDefinition): boolean;
	export type Node = import('estree').Node;
	export type NodeWithPropertyDefinition = Node | {
		type: 'PropertyDefinition';
		computed: boolean;
		value: Node;
	};
}

//# sourceMappingURL=index.d.ts.map