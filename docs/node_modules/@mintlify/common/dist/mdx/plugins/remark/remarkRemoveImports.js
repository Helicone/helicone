import { remove } from 'unist-util-remove';
export const remarkRemoveImports = () => (tree) => {
    remove(tree, (node) => {
        if (node.type === 'mdxjsEsm') {
            const mdxjsEsm = node;
            return mdxjsEsm.value.startsWith('import');
        }
        return false;
    });
    return tree;
};
