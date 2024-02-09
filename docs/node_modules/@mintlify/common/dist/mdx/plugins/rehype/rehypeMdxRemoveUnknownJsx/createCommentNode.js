export const createCommentNode = (componentName) => {
    const comment = ` Component ${componentName} does not exist. `;
    return {
        type: 'mdxFlowExpression',
        value: `/* ${comment} */`,
        data: {
            estree: {
                type: 'Program',
                body: [],
                comments: [
                    {
                        type: 'Block',
                        value: comment,
                    },
                ],
                sourceType: 'module',
            },
        },
    };
};
