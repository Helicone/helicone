export const findParentSchema = (tagName, parents, nodeToSchema) => {
    // find the nearest parent node that has an associated DataSchema
    const parentField = parents.findLast((node) => nodeToSchema.has(node));
    // we only want parents that have the same tag name (e.g. ParamField)
    if (parentField === undefined || parentField.name !== tagName) {
        return undefined;
    }
    return nodeToSchema.get(parentField);
};
