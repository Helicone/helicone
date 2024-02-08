import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';
export const rehypeZoomImages = () => (tree) => {
    visit(tree, 'mdxJsxFlowElement', (node, index, parent) => {
        const element = node;
        if (element.name === 'img' || element.name === 'picture' || element.name === 'figure') {
            const noZoom = element.attributes.find((attr) => 'name' in attr && attr.name === 'noZoom');
            if (!noZoom && parent && index != null) {
                parent.children.splice(index, 1, u('element', {
                    tagName: 'ZoomImage',
                }, [node]));
            }
        }
    });
};
