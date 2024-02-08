import { fromHtml } from 'hast-util-from-html';
import { visit } from 'unist-util-visit';
export const rehypeRawComponents = () => {
    return (tree) => {
        visit(tree, 'raw', (raw, i, parent) => {
            const rawAst = fromHtml(raw.value, { fragment: true });
            if (parent && i) {
                parent.children[i] = rawAst;
            }
        });
    };
};
